/**
 * Middleware de instrumentación automática para Prometheus.
 *
 * Intercepta cada petición HTTP y registra:
 *  - Contador: http_requests_total  {method, route, status_code}
 *  - Histograma: http_request_duration_seconds {method, route, status_code}
 *  - Gauge: active_connections
 *
 * La "route" se normaliza usando `req.route.path` (si existe) para evitar
 * alta cardinalidad por IDs dinámicos en la URL.
 */
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  activeConnections,
} from '../routes/metricsRoutes.js';

export function prometheusMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  activeConnections.inc();

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSeconds = durationNs / 1e9;

    // Normalizar ruta: usa el pattern de Express (ej: /api/hc/:id)
    // en lugar de la URL real (ej: /api/hc/550e8400-...) para evitar
    // alta cardinalidad en Prometheus.
    const route =
      req.route?.path ??
      req.baseUrl ??
      req.path.replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        ':id'
      ) ??
      'unknown';

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
    activeConnections.dec();
  });

  next();
}
