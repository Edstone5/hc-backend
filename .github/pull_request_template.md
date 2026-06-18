<!--
  Plantilla de Pull Request — Gobernanza del Cambio (Lab S11).
  El título del PR debe seguir Conventional Commits: tipo(scope): descripción
  Ej.: feat(hc): agregar endpoint de evolución clínica
-->

## ¿Qué cambia y por qué?

<!-- Describe el cambio y la motivación. Enlaza el issue: Closes #NNN -->

## IC afectado(s)

<!-- Ítems de configuración tocados (ver docs/STATUS_ACCOUNTING.md). Ej.: IC-COD-03 -->

## Tipo de cambio

- [ ] `feat` — nueva funcionalidad
- [ ] `fix` — corrección de bug
- [ ] `docs` — solo documentación
- [ ] `refactor` / `test` / `chore` / `ci`

## Checklist de gobernanza (PR Checks)

- [ ] Los **checks automáticos** (build, lint, tests + cobertura, commitlint) están en verde.
- [ ] `npm test` pasa localmente (suite completa).
- [ ] **No** se introducen secretos (`.env`, contraseñas, tokens) en el diff.
- [ ] La línea base **no** se modifica directamente: este cambio entra por PR.
- [ ] Se actualizó la documentación pertinente (ADR / README / SCM) si aplica.
- [ ] El cambio quedará registrado en `docs/STATUS_ACCOUNTING.md`.

## ¿Cómo se probó?

<!-- Pasos de verificación manual o automática. -->

## Aprobación

> Recordatorio (slide 20): la automatización valida lo mecánico; **las personas validan
> la arquitectura**. Requiere al menos **1 aprobación** de un CODEOWNER antes del merge.
