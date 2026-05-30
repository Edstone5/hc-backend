/**
 * GET /metrics
 *
 * SRE — Endpoint compatible con Prometheus.
 * Expone métricas de Node.js (GC, event-loop, heap) y métricas
 * de negocio custom (requests HTTP, latencias).
 *
 * En producción este endpoint DEBE protegerse con una red privada
 * o con un token de scrape para evitar filtrar datos internos.
 */
import { Router } from 'express';
import client from 'prom-client';

export const metricsRouter = Router();

// ── Registro global y métricas por defecto de Node.js ─────────────────────────
const register = new client.Registry();
register.setDefaultLabels({ app: 'hc-backend' });
client.collectDefaultMetrics({ register });

// ── Métricas custom de negocio ────────────────────────────────────────────────

/** Contador de peticiones HTTP por método, ruta y código de estado */
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de peticiones HTTP recibidas',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/** Histograma de duración de peticiones HTTP (en segundos) */
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

/** Gauge de conexiones activas */
export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Número de conexiones HTTP activas en este momento',
  registers: [register],
});

/** Contador de errores de dominio (validaciones) */
export const domainErrorsTotal = new client.Counter({
  name: 'domain_errors_total',
  help: 'Total de errores de dominio/validación capturados',
  labelNames: ['module'],
  registers: [register],
});

// ── Exportar registro para uso en middleware ──────────────────────────────────
export { register };

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags:
 *       - Observabilidad
 *     summary: Métricas Prometheus
 *     security: []
 *     description: >
 *       Expone métricas en formato text/plain compatible con Prometheus.
 *       Incluye métricas de proceso Node.js (GC, heap, event-loop) y
 *       métricas custom de negocio (requests HTTP, latencias, errores de dominio).
 *     responses:
 *       200:
 *         description: Métricas en formato Prometheus
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP http_requests_total Total de peticiones HTTP recibidas
 *                 # TYPE http_requests_total counter
 *                 http_requests_total{method="GET",route="/health",status_code="200"} 42
 */
metricsRouter.get('/', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
});
