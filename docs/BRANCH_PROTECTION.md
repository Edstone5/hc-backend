# Protección de la línea base — Branch Protection Rules

Parte del flujo de **Gobernanza del Cambio** (Laboratorio Dual S11). Define cómo se
**blinda la rama principal** de cada repositorio para que la línea base solo cambie a
través de Pull Requests revisados y con los PR Checks en verde.

> «Proteger `main` es proteger el proceso.» — Chacon & Straub (2014)
> «Si los administradores pueden evadir las revisiones, no existe un verdadero control de cambios.»

## Reglas exigidas (por rama protegida)

Rama protegida: `main` (frontend) y `testeo1` (backend) — la rama de integración/producción.

| Control                                    | Valor                                                                                                                      | Concepto (slide 12)            |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Prohibir push directo                      | ✔ (solo vía PR)                                                                                                           | Integridad de la línea base    |
| Revisiones aprobatorias obligatorias       | **1** mínimo                                                                                                               | Juicio humano (CODEOWNERS)     |
| Descartar aprobaciones al hacer push nuevo | ✔                                                                                                                         | Evita aprobar y luego cambiar  |
| Revisión de CODEOWNERS obligatoria         | ✔                                                                                                                         | Dueño de código revisa         |
| Checks de estado obligatorios              | `Compilación`, `Linter`, `Unit Tests + Cobertura`, `Política de commits` (BE) · `Linter`, `Compilación`, `Unit Tests` (FE) | Sin checks no hay merge        |
| Ramas actualizadas antes del merge         | ✔ (strict)                                                                                                                | Evita "merge skew"             |
| Commits firmados                           | ✔                                                                                                                         | No repudio (baseline firmada)  |
| Historial lineal / sin force-push          | ✔                                                                                                                         | Historial inmutable            |
| Aplicar también a administradores          | ✔ (`enforce_admins`)                                                                                                      | Cierra el bypass de gobernanza |

## Aplicación automática

Las reglas se aplican con el script [`scripts/apply-branch-protection.sh`](../scripts/apply-branch-protection.sh)
(requiere [GitHub CLI](https://cli.github.com/) autenticada con permiso `repo`):

```bash
# Backend (rama testeo1)
bash scripts/apply-branch-protection.sh Edstone5/hc-backend testeo1

# Frontend (rama main)
bash scripts/apply-branch-protection.sh Edstone5/hc-frontend main
```

> **Nota de gobernanza:** los nombres de los _status checks_ deben coincidir EXACTAMENTE
> con el campo `name:` de cada job en `.github/workflows/ci.yml`. Si renombras un job,
> actualiza también la regla de protección.

## Verificación

En GitHub: **Settings → Branches → Branch protection rules**, o por API:

```bash
gh api repos/Edstone5/hc-backend/branches/testeo1/protection | jq '{
  reviews: .required_pull_request_reviews.required_approving_review_count,
  checks: .required_status_checks.contexts,
  admins: .enforce_admins.enabled,
  signatures: .required_signatures.enabled
}'
```

## Plan de contingencia

Si el repositorio es de un plan que no permite branch protection por API (cuentas
free en repos privados), las reglas se configuran **manualmente** en Settings → Branches
con los mismos valores de la tabla, y se registra la acción en `docs/STATUS_ACCOUNTING.md`.
