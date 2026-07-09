// Verificación local del pipeline de trazas (sin clúster).
// Uso:  OTEL_TRACES_CONSOLE=true node --import ./tracing.js scripts/smoke-trace.mjs
// Debe imprimir a stdout un span con su traceId/spanId y el atributo hc.smoke.
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('hc-backend.smoke');

await tracer.startActiveSpan('smoke.persistencia', async (span) => {
  span.setAttribute('hc.smoke', true);
  span.setAttribute('hc.adapter', 'persistence');
  span.setAttribute('db.system', 'mysql');
  await new Promise((r) => setTimeout(r, 20));
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
});

// Deja respirar al exportador antes de salir.
await new Promise((r) => setTimeout(r, 200));
console.log('[smoke] fin');
