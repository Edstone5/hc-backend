# ADR-0004: Observabilidad con Prometheus y Grafana

**Estado**: Aceptado  
**Fecha**: 2026-05  
**Autores**: Equipo HC-UNJBG

---

## Contexto

El sílabo de Ingeniería de Software II (Semana 13-14) exige implementar un **SRE Dashboard** con métricas de la aplicación. El sistema necesita:

1. Un **liveness probe** (`/health`) para Docker/Kubernetes
2. Métricas en formato estándar para visualización
3. Un dashboard persistente sin configuración manual

La aplicación es un servidor Node.js/Express. Las opciones consideradas fueron:

- **Prometheus + Grafana** (open source, estándar de la industria)
- **DataDog** (SaaS, costoso)
- **New Relic** (SaaS, complejo de integrar)
- **Express Status Monitor** (solo métricas básicas en HTML)

---

## Decisión

Adoptamos **prom-client** (Node.js) + **Prometheus** + **Grafana**, todos ejecutados en Docker Compose.

### Arquitectura implementada

```
Express app
  └── GET /metrics  ←── prom-client (text/plain)
                             ↑
                     Prometheus (scrape cada 15s)
                             ↓
                     Grafana (dashboard pre-configurado)
                    http://localhost:3001
```

### Métricas expuestas

| Nombre                          | Tipo      | Descripción                                     |
| ------------------------------- | --------- | ----------------------------------------------- |
| `http_requests_total`           | Counter   | Total de peticiones HTTP por método/ruta/status |
| `http_request_duration_seconds` | Histogram | Latencia en segundos (buckets p50/p95/p99)      |
| `active_connections`            | Gauge     | Conexiones HTTP activas en este instante        |
| `domain_errors_total`           | Counter   | Errores de validación de dominio por módulo     |
| `nodejs_heap_size_used_bytes`   | Gauge     | Uso de heap de Node.js (default metric)         |
| `nodejs_gc_duration_seconds`    | Histogram | Duración del Garbage Collector (default metric) |

### Dashboard Grafana

Pre-configurado vía provisioning (`observability/grafana/provisioning/`):

- Sin necesidad de configurar datasource manualmente
- Dashboard "HC Backend — SRE Dashboard" con 6 paneles
- Se levanta automáticamente con `docker-compose up`

---

## Consecuencias

**Positivas**:

- Observabilidad inmediata sin agente externo
- Formato Prometheus es el estándar en Kubernetes/DevOps
- Grafana provisioning garantiza reproducibilidad
- El middleware `prometheusMiddleware.js` instrumenta **todas** las rutas automáticamente
- Altas cardinalidades evitadas: los UUIDs en URLs se normalizan a `:id`

**Negativas**:

- Dos servicios adicionales en docker-compose (+200MB de memoria en desarrollo)
- El endpoint `/metrics` debe protegerse con red privada o token en producción
- `prom-client` no tiene soporte oficial para Deno/Bun (no aplica aquí)

---

## Alternativas Descartadas

| Alternativa              | Razón                                                 |
| ------------------------ | ----------------------------------------------------- |
| DataDog                  | Costo mensual, no justificado para proyecto académico |
| `express-status-monitor` | Solo HTML, sin persistencia, no estándar              |
| OpenTelemetry            | Mayor complejidad, overkill para este alcance         |

---

## Referencias

- [prom-client GitHub](https://github.com/siimon/prom-client)
- [Prometheus docs](https://prometheus.io/docs/)
- [Grafana provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- SLOs definidos: `docs/SLO.md`
