# Service Level Objectives (SLOs) — HC Backend

**Proyecto**: Sistema de Historia Clínica — UNJBG  
**Versión**: 2.0.0 | **Fecha**: 2026-05

> Los SLOs definen el nivel de confiabilidad que el equipo se compromete a mantener.
> Se miden con las métricas expuestas en `/metrics` (Prometheus) y visualizadas en Grafana.

---

## 1. Definiciones

| Término          | Definición                                                 |
| ---------------- | ---------------------------------------------------------- |
| **SLI**          | Service Level Indicator — métrica concreta medida          |
| **SLO**          | Service Level Objective — objetivo porcentual sobre el SLI |
| **SLA**          | Service Level Agreement — compromiso formal con el usuario |
| **Error Budget** | 100% - SLO = margen de errores permitidos en el período    |

---

## 2. SLOs de Disponibilidad

### SLO-01: Disponibilidad del API

| Campo            | Valor                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| **SLI**          | `sum(rate(http_requests_total{status_code!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))` |
| **Objetivo**     | ≥ 99.0% mensual                                                                                 |
| **Error Budget** | 1.0% = ~7.2 horas/mes de downtime permitido                                                     |
| **Ventana**      | Rolling 30 días                                                                                 |
| **Alerta**       | Si el budget baja del 50% en < 14 días                                                          |

### SLO-02: Disponibilidad del endpoint `/health`

| Campo        | Valor                                                        |
| ------------ | ------------------------------------------------------------ |
| **SLI**      | Porcentaje de respuestas 200 en `GET /health` en últimas 24h |
| **Objetivo** | ≥ 99.5%                                                      |
| **Ventana**  | Rolling 24 horas                                             |

---

## 3. SLOs de Latencia

### SLO-03: Latencia P95 de endpoints críticos

Endpoints críticos: `POST /api/auth/login`, `GET /api/hc/:id`, `GET /api/catalogo/:nombre`

| Campo        | Valor                                                                      |
| ------------ | -------------------------------------------------------------------------- |
| **SLI**      | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` |
| **Objetivo** | P95 ≤ 500 ms                                                               |
| **Ventana**  | Rolling 1 hora                                                             |
| **Alerta**   | Si P95 > 500 ms por más de 5 minutos consecutivos                          |

### SLO-04: Latencia P99 general

| Campo        | Valor                                                                      |
| ------------ | -------------------------------------------------------------------------- |
| **SLI**      | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))` |
| **Objetivo** | P99 ≤ 2 segundos                                                           |
| **Ventana**  | Rolling 1 hora                                                             |

---

## 4. SLOs de Calidad del Código

### SLO-05: Cobertura de tests

| Campo        | Valor                                                           |
| ------------ | --------------------------------------------------------------- |
| **SLI**      | Porcentaje de statements cubiertos por tests unitarios (Vitest) |
| **Objetivo** | ≥ 80% en cada merge a `main`                                    |
| **Medición** | Automática en CI (`npx vitest run --coverage`)                  |
| **Bloqueo**  | El PR no puede mergearse si la cobertura baja del 80%           |

### SLO-06: Tests pasando

| Campo        | Valor                                              |
| ------------ | -------------------------------------------------- |
| **SLI**      | Porcentaje de tests que pasan en la suite completa |
| **Objetivo** | 100% (cero fallos permitidos en `main`)            |
| **Medición** | Automática en CI                                   |

---

## 5. SLOs de Infraestructura

### SLO-07: Tiempo de startup del contenedor

| Campo        | Valor                                                             |
| ------------ | ----------------------------------------------------------------- |
| **SLI**      | Tiempo desde `docker-compose up` hasta que `/health` devuelve 200 |
| **Objetivo** | ≤ 60 segundos                                                     |
| **Medición** | Manual en cada release                                            |

### SLO-08: Uso de memoria del proceso Node.js

| Campo        | Valor                                  |
| ------------ | -------------------------------------- |
| **SLI**      | `nodejs_heap_size_used_bytes`          |
| **Objetivo** | ≤ 512 MB en operación normal           |
| **Alerta**   | Si heap > 400 MB por más de 10 minutos |

---

## 6. Error Budget Policy

| Estado del Budget | Acción                                              |
| ----------------- | --------------------------------------------------- |
| > 50% restante    | Trabajo normal: features, refactoring               |
| 25–50% restante   | Priorizar mejoras de confiabilidad sobre features   |
| < 25% restante    | **Freeze** de features; solo fixes y mejoras de SRE |
| 0% (agotado)      | Post-mortem obligatorio + plan de remediación       |

---

## 7. Dashboards y Alertas

| Panel Grafana          | Métrica Prometheus                        | SLO relacionado |
| ---------------------- | ----------------------------------------- | --------------- |
| "Requests por segundo" | `http_requests_total`                     | SLO-01          |
| "P95 Latencia"         | `http_request_duration_seconds`           | SLO-03          |
| "Errores 5xx"          | `http_requests_total{status_code=~"5.."}` | SLO-01          |
| "Heap usada"           | `nodejs_heap_size_used_bytes`             | SLO-08          |

**Acceso**: `http://localhost:3001` (Grafana) → Dashboard "HC Backend — SRE Dashboard"

---

## 8. Revisión de SLOs

Los SLOs se revisan **trimestralmente** o después de cualquier incidente mayor (P0/P1).
La revisión incluye:

1. Análisis del error budget consumido en el trimestre
2. Ajuste de objetivos si el sistema consistentemente supera o no alcanza el SLO
3. Identificación de las causas raíz de las violaciones

---

_Documento bajo control de versiones en `docs/SLO.md`._
