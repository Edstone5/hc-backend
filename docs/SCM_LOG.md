# Log de Auditoría SCM (Status Accounting automático)

Registro de auditoría generado por la **contabilidad de estado** del pipeline
(Laboratorio Dual, Fase 5). Cada merge exitoso a la rama principal agrega aquí una
fila con el rastro de auditoría del cambio, conforme a IEEE Std 828-2012 (qué cambió,
quién, resultado de CI, cuándo y en qué baseline). La generación es automática vía
`scripts/scm-status-report.mjs` (job `status-accounting` de `.github/workflows/ci.yml`),
que además produce el artefacto `scm-status-report.json` y publica un log anotado en el
historial de _Releases_ del repositorio.

> Para el registro de cambios curado (formato RFC) ver [STATUS_ACCOUNTING.md](STATUS_ACCOUNTING.md).

| ID-Cambio | Commit  | Descripción                                | Autor            | Status Check CI | Fecha      | Baseline |
| --------- | ------- | ------------------------------------------ | ---------------- | --------------- | ---------- | -------- |
| RFC-107   | b75f14b | baseline v1.1.0 firmada gpg + bitácora scm | Edson Condemaita | ✅ passed       | 2026-06-11 | v1.1.0   |
