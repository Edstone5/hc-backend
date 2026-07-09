/**
 * Arranque del SDK de OpenTelemetry (trazas distribuidas).
 *
 * Se carga ANTES que el resto de la app para poder parchear http, express y
 * mysql2:   node --import ./tracing.js api.js   (ver script "start").
 *
 * No hace nada en pruebas ni si no hay destino configurado, de modo que la suite
 * de tests y el arranque local sin observabilidad no se ven afectados.
 *
 * Recursos/metadatos enriquecidos (rúbrica): se pasan por variables de entorno
 * que el SDK lee automáticamente:
 *   OTEL_SERVICE_NAME=hc-backend
 *   OTEL_RESOURCE_ATTRIBUTES=service.namespace=historia-clinica,deployment.environment=mvp-desarrollo,service.version=2.1.0
 * Destino de las trazas:
 *   OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring:4317   (OTLP/gRPC)
 * Modo consola para verificación local:
 *   OTEL_TRACES_CONSOLE=true
 */
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const consoleMode = process.env.OTEL_TRACES_CONSOLE === 'true';
const disabled =
  process.env.NODE_ENV === 'test' ||
  process.env.OTEL_SDK_DISABLED === 'true' ||
  (!endpoint && !consoleMode);

if (!disabled) {
  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import(
      '@opentelemetry/auto-instrumentations-node'
    );

    const sdkOptions = {
      instrumentations: [
        getNodeAutoInstrumentations({
          // Ruido de disco que no aporta a la traza de negocio.
          '@opentelemetry/instrumentation-fs': { enabled: false },
          // Instrumentaciones clave para el cruce API ↔ persistencia:
          '@opentelemetry/instrumentation-http': { enabled: true },
          '@opentelemetry/instrumentation-express': { enabled: true },
          '@opentelemetry/instrumentation-mysql2': { enabled: true },
        }),
      ],
    };

    if (consoleMode) {
      // Verificación local: imprime cada span a stdout en cuanto termina.
      const base = await import('@opentelemetry/sdk-trace-base');
      sdkOptions.spanProcessors = [
        new base.SimpleSpanProcessor(new base.ConsoleSpanExporter()),
      ];
    } else {
      // Producción: exporta por OTLP/gRPC al OpenTelemetry Collector.
      const { OTLPTraceExporter } = await import(
        '@opentelemetry/exporter-trace-otlp-grpc'
      );
      sdkOptions.traceExporter = new OTLPTraceExporter({ url: endpoint });
    }

    const sdk = new NodeSDK(sdkOptions);
    sdk.start();

    const destino = consoleMode ? 'consola' : endpoint;
    // eslint-disable-next-line no-console
    console.log(`[otel] tracing iniciado (destino: ${destino})`);

    const cerrar = () =>
      sdk
        .shutdown()
        .catch(() => {})
        .finally(() => process.exit(0));
    process.once('SIGTERM', cerrar);
    process.once('SIGINT', cerrar);
  } catch (e) {
    // La observabilidad nunca debe tumbar el servicio.
    // eslint-disable-next-line no-console
    console.error('[otel] no se pudo iniciar el tracing:', e.message);
  }
}
