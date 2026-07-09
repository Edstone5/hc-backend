# ADR-0042 — Módulo Informe Final de Intervención (RF-13)

- **Estado**: Aceptado ✅
- **Fecha**: 2026-07-08
- **Decisores**: Grupo 2 — Vaca Code

## Contexto

RF-13 exige que el estudiante genere el Informe Final del caso compilando
encabezado, procedimientos, odontograma final, exámenes adjuntos, medicamentos,
incidencias y evaluación docente; que exista un historial de informes por
historia; y que el informe pueda marcarse como "Enviado para validación" con
notificación al docente. El requisito estaba cubierto solo por composición de
frontend, sin artefacto de dominio propio ni trazabilidad en la matriz.

## Decisión

Crear el módulo hexagonal `informeFinal/` con la tríada estándar del proyecto:

- **Dominio** (`informeFinal/domain/informeFinalDomain.js`):
  `InformeFinalAggregate` con invariantes ejecutables — identificadores UUID v4,
  compilación mínima obligatoria (encabezado, procedimientos como listado,
  odontograma), máquina de estados `generado → enviado_validacion → validado`
  protegida por `enviarParaValidacion()`, y `esCompleto()` para el cierre
  académico. Puerto `IInformeFinalRepository`.
- **Aplicación** (`informeFinal/application/informeFinalController.js`):
  generar, listar historial por historia y enviar a validación; al enviar,
  registra una `NotificacionAggregate` de tipo `validacion` para el docente
  reutilizando el módulo de notificaciones (RF-10).
- **Infraestructura** (`informeFinal/infrastructure/informeFinalRepository.js`):
  SQL posicional `$1…$n` sobre la tabla `informe_final`
  (migración `db/migrations/007_informe_final.sql`, dialecto dual MySQL/NeonDB).
- **Rutas** (`routes/hcRoutes.js`): `GET/POST /api/hc/:id/informe-final` y
  `PATCH /api/hc/:id/informe-final/:idInforme/enviar`, bajo authMiddleware.

## Verificación

- Pruebas unitarias de dominio en `test/informeFinal.domain.test.js`
  (invariantes con mensaje exacto, transición de estados, mapeo posicional).
- Especificación ejecutable `features/informeFinal.feature` con
  `features/step_definitions/informeFinalSteps.js` (5 escenarios, incluida la
  notificación al docente y el rechazo de reenvío).

## Consecuencias

- RF-13 queda trazable a artefactos de dominio propios en la matriz de
  trazabilidad del Informe Final del Producto.
- El envío a validación acopla informeFinal → notificacion solo a nivel de
  aplicación; el dominio permanece aislado.
- La tabla `informe_final` requiere aplicar la migración 007 en los entornos.
