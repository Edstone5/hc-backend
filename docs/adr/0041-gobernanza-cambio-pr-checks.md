# ADR-0041: Gobernanza del cambio — PR Checks, branch protection y status accounting

- **Estado:** Aceptada
- **Fecha:** 2026-06-18
- **Contexto:** Gestión de Configuración (SCM) — control formal del cambio (Lab Dual S11)

## Contexto

Tras declarar la baseline firmada `v1.1.0` (ADR-0040), faltaba **ejecutar la gobernanza
del cambio de forma automática**, no solo documentarla. El `SCM_PLAN.md` referenciaba un
pipeline `ci.yml` (CI-05) y el README anunciaba "CI 6 jobs", pero el workflow **no existía**
en `hc-backend`; el `hc-frontend` solo tenía `deploy.yml` (despliegue a Pages), sin checks
de integración. Tampoco había plantilla de PR, CODEOWNERS, reglas de protección de rama ni
un registro de contabilidad de estado.

Esto es exactamente el "bypass de la gobernanza" descrito en la sesión S12: políticas
huérfanas y automatización ausente. El CCB tradicional (reuniones) no escala al desarrollo
moderno; la solución es **trasladar las políticas al repositorio y al pipeline**.

## Decisión

Implementar el flujo de gobernanza del cambio sobre el MVP v1.1, en **ambos repositorios**:

1. **GitHub Actions (PR Checks).** `.github/workflows/ci.yml` que corre en `pull_request`
   y `push` a las ramas principales:
   - Backend: jobs `Compilación (npm ci)`, `Linter (eslint)`,
     `Unit Tests + Cobertura (vitest)` y `Política de commits (commitlint)`.
   - Frontend: jobs `Linter (eslint)`, `Compilación (vite build)` y `Unit Tests (vitest)`.
     Mapea a la "compuerta de integración" (slide 10): la máquina verifica requisitos
     objetivos **antes** de la revisión humana. El `deploy.yml` del frontend se conserva
     separado (despliegue solo tras merge a `main`).
2. **PR Checks formales.** `.github/pull_request_template.md` (checklist de gobernanza,
   IC afectado, no-secretos) y `.github/CODEOWNERS` (revisión obligatoria del dueño de
   código según rol del equipo).
3. **Branch Protection Rules.** `docs/BRANCH_PROTECTION.md` con la especificación y
   `scripts/apply-branch-protection.sh` (`gh api`) para aplicarlas: PR obligatorio, 1
   aprobación de CODEOWNER, checks estrictos, commits firmados, historial lineal y
   `enforce_admins` (cierra el bypass de administradores).
4. **Status Accounting.** `docs/STATUS_ACCOUNTING.md`: registro vivo en formato RFC
   (ID cambio, IC afectado, aprobador, fecha, estado) que responde qué cambió, quién lo
   aprobó y cuándo, con cadena de evidencia commit → PR → aprobador → tag.

## Consecuencias

- Ningún cambio llega a la línea base sin checks en verde y aprobación humana; la
  automatización valida lo mecánico y las personas validan la arquitectura (slide 20).
- La autoridad final de merge sigue siendo del CODEOWNER/CCB, no del pipeline.
- Los nombres de los status checks quedan acoplados al campo `name:` de cada job; renombrar
  un job exige actualizar la regla de protección (documentado en `BRANCH_PROTECTION.md`).
- La aplicación efectiva de branch protection depende de ejecutar el script con `gh`
  autenticada (no disponible en el entorno de desarrollo local); se documenta el plan de
  contingencia (configuración manual en Settings → Branches).
- Se actualizan `SCM_PLAN.md` (CI-05 ahora real) y `README.md` (descripción del CI acorde
  a los jobs implementados).
