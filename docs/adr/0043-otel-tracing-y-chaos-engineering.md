# ADR-0043 — Trazas distribuidas con OpenTelemetry y Chaos Engineering con Chaos Mesh

- **Estado**: Aceptado ✅
- **Fecha**: 2026-07-09
- **Decisores**: Grupo 2 — Vaca Code

## Contexto

El sistema ya expone métricas Prometheus (ADR-0004) y opera bajo GitOps con Argo CD
(ADR-0005 y lab de Prometheus). Falta **trazabilidad distribuida** para ver cómo
viaja una petición a través de los adaptadores hexagonales, y una forma
**disciplinada y versionada** de validar la resiliencia ante la incertidumbre de
la nube (latencia de red entre el servicio de dominio y la base de datos).

## Decisión

**Observabilidad de trazas (OpenTelemetry):**

- Bootstrap del SDK en `hc-backend/tracing.js`, cargado con
  `node --import ./tracing.js api.js` (script `start`), de modo que instrumenta
  `http`, `express` y `mysql2` antes de que la app los cargue.
- Auto-instrumentación (`@opentelemetry/auto-instrumentations-node`) + recursos
  enriquecidos por variables de entorno (`OTEL_SERVICE_NAME`,
  `OTEL_RESOURCE_ATTRIBUTES`) y propagación de contexto W3C `tracecontext` (por
  defecto). El span de MySQL materializa el cruce **adaptador de API ↔ adaptador
  de persistencia** con un Trace ID continuo.
- Exportación OTLP/gRPC al **OTel Collector** (namespace `monitoring`), que agrupa
  (batch), enriquece (resource) y reexporta a **Jaeger** para el análisis
  waterfall. Manifiestos versionados en GitOps.
- Guardas: no instrumenta en `NODE_ENV=test` ni sin `OTEL_EXPORTER_OTLP_ENDPOINT`;
  la observabilidad nunca tumba el servicio (try/catch). La suite de 1501 pruebas
  no se ve afectada.

**Chaos Engineering (Chaos Mesh):**

- Los experimentos se declaran como **CRDs de Kubernetes** (`NetworkChaos`),
  versionados como código en `lab-chaos-otel/chaos/`, no con `kubectl delete`
  manual.
- Método científico con dos iteraciones: estado estable → hipótesis falsable →
  experimento acotado (mode:one, duración limitada) → observación en
  Prometheus/Jaeger → veredicto → iteración.

## Alternativas consideradas

- **Jaeger client directo (sin Collector):** descartado; el Collector desacopla la
  app del backend de trazas y permite procesar/enriquecer (recomendado en prod).
- **Inyección manual de fallos (`kubectl delete`):** descartado; no es
  reproducible ni versionable (la rúbrica exige CRDs).

## Consecuencias

- El sistema emite trazas reales con propagación de contexto entre el adaptador de
  API y el de persistencia; el cuello de botella se identifica por span.
- La resiliencia se valida con experimentos reproducibles y se descubren ítems de
  configuración a mejorar (reintentos con backoff, circuit breaker) para iterar.
- Nuevas dependencias de runtime: paquetes `@opentelemetry/*`. La imagen arranca
  con `--import ./tracing.js`; requiere un tag nuevo publicado por el pipeline.
