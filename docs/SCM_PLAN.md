# Plan de Gestión de Configuración de Software (SCM)

**Conforme a IEEE 828-2012**  
**Proyecto**: Sistema de Historia Clínica — UNJBG  
**Versión**: 2.0.0 | **Fecha**: 2026-05 | **Estado**: Activo

---

## 1. Introducción

### 1.1 Propósito

Este documento define el Plan de Gestión de Configuración de Software (SCM Plan) para el sistema HC-UNJBG. Establece políticas, procedimientos y herramientas para controlar los cambios al software a lo largo de su ciclo de vida, garantizando integridad, trazabilidad y reproducibilidad.

### 1.2 Alcance

Cubre el repositorio `hc-backend` (API Node.js/Express con arquitectura hexagonal) y el repositorio `hc-frontend` (React + Vite), desde el desarrollo hasta el despliegue en producción.

### 1.3 Términos clave

| Término                        | Definición                                                                |
| ------------------------------ | ------------------------------------------------------------------------- |
| **CI (Item de Configuración)** | Artefacto bajo control de versiones (código, config, docs, Docker images) |
| **Baseline**                   | Snapshot aprobado e inmutable de un conjunto de CIs                       |
| **CCB**                        | Configuration Control Board — responsable de aprobar cambios              |
| **SCM**                        | Software Configuration Management                                         |

---

## 2. Gestión de Configuración de Software

### 2.1 Identificación de Ítems de Configuración (CIs)

| ID    | CI                       | Tipo            | Ubicación                          |
| ----- | ------------------------ | --------------- | ---------------------------------- |
| CI-01 | Código fuente backend    | Software        | `hc-backend/`                      |
| CI-02 | Código fuente frontend   | Software        | `hc-frontend/`                     |
| CI-03 | Esquema base de datos    | Datos           | `hc-backend/db/init.sql`           |
| CI-04 | Configuración Docker     | Infraestructura | `docker-compose.yml`, `Dockerfile` |
| CI-05 | Pipeline CI/CD           | Infraestructura | `.github/workflows/ci.yml`         |
| CI-06 | Configuración Prometheus | Observabilidad  | `observability/prometheus.yml`     |
| CI-07 | Dashboards Grafana       | Observabilidad  | `observability/grafana/`           |
| CI-08 | Documentación técnica    | Docs            | `docs/`                            |
| CI-09 | Variables de entorno     | Configuración   | `.env.example` (no `.env`)         |
| CI-10 | Dependencias NPM         | Dependencias    | `package-lock.json`                |

### 2.2 Esquema de Nombrado y Versiones

#### Versiones del sistema

Se aplica **Semantic Versioning 2.0.0** (`MAYOR.MENOR.PARCHE`):

- `MAYOR`: cambio incompatible en la API (breaking change)
- `MENOR`: nueva funcionalidad compatible hacia atrás
- `PARCHE`: corrección de errores

#### Etiquetas Git

```
v{MAYOR}.{MENOR}.{PARCHE}[-{prerelease}]
```

Ejemplos: `v2.0.0`, `v2.1.0-beta.1`, `v2.1.1`

#### Commits (Conventional Commits)

```
{type}({scope}): {descripción corta en imperativo}

{cuerpo opcional}

{footers: refs, breaking changes}
```

Tipos permitidos:

- `feat` — nueva funcionalidad
- `fix` — corrección de bug
- `docs` — solo documentación
- `refactor` — refactoring sin cambio funcional
- `test` — tests
- `chore` — tareas de mantenimiento
- `ci` — cambios al pipeline
- `perf` — mejora de rendimiento

---

## 3. Control de Configuración

### 3.1 Estructura de Ramas (Git Flow adaptado)

```
main          ◄── producción: solo PR aprobados, tags de versión
  │
  ├── develop ◄── integración continua: todas las features van aquí primero
  │    │
  │    ├── feature/HC-{issue}-{descripción}   (nueva funcionalidad)
  │    ├── fix/HC-{issue}-{descripción}        (corrección de bug)
  │    └── docs/HC-{issue}-{descripción}       (solo documentación)
  │
  └── hotfix/HC-{issue}-{descripción}          (fix urgente en producción)
```

### 3.2 Reglas de Ramas

| Rama        | Protecciones                                       | Merge strategy       |
| ----------- | -------------------------------------------------- | -------------------- |
| `main`      | PR requerido, 1 aprobador, CI verde, no force-push | Merge commit con tag |
| `develop`   | PR requerido, CI verde                             | Squash merge         |
| `feature/*` | Sin restricciones                                  | —                    |
| `hotfix/*`  | PR a `main` Y `develop`                            | Merge commit         |

> La aplicación efectiva de estas protecciones (branch protection rules, commits
> firmados, CODEOWNERS) está especificada y automatizada en
> [`docs/BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md) +
> [`scripts/apply-branch-protection.sh`](../scripts/apply-branch-protection.sh) (ADR-0041).
> Los **PR Checks** se ejecutan vía GitHub Actions: `.github/workflows/ci.yml`.

### 3.3 Proceso de Solicitud de Cambio (CCR)

```
Desarrollador                 Revisor (CCB)              CI/CD
     │                              │                       │
     ├─ crea feature/fix branch     │                       │
     ├─ desarrolla + tests          │                       │
     ├─ abre Pull Request ──────────►                       │
     │                        revisa código                 │
     │                        revisa tests ─────────────────►
     │                              │                 corre suite
     │                              │◄──────────── ✓ cobertura ≥80%
     │◄───────── aprobación ─────────│                       │
     ├─ merge a develop             │                       │
     │                              │               deploy en staging
```

### 3.4 Criterios de Aceptación para Merge

- [ ] Todos los tests pasan (1276+ tests)
- [ ] Cobertura de código ≥ 80%
- [ ] Sin conflictos de merge
- [ ] Al menos 1 revisión aprobada
- [ ] Sin secretos (`.env`, contraseñas) en el diff

---

## 4. Contabilidad de Estado de Configuración

### 4.1 Baselines

| Baseline | Descripción                           | Tag Git  | Fecha   |
| -------- | ------------------------------------- | -------- | ------- |
| BL-01    | Arquitectura hexagonal inicial        | `v1.0.0` | 2026-04 |
| BL-02    | MVP con MySQL + CI/CD + SRE           | `v2.0.0` | 2026-05 |
| BL-03    | GitOps + Mutation Testing + CI 6 jobs | `v2.1.0` | 2026-05 |

### 4.2 Registro de Cambios

Todo cambio se registra en [`docs/STATUS_ACCOUNTING.md`](STATUS_ACCOUNTING.md) (contabilidad
de estado, formato RFC: ID cambio · IC afectado · aprobador · fecha · estado) y, para
releases, en `CHANGELOG.md` con formato Keep a Changelog.

### 4.3 Trazabilidad

Cada commit referencia el issue de GitHub con `Refs #NNN` o `Closes #NNN` en el footer.

---

## 5. Auditoría de Configuración

### 5.1 Auditoría Funcional (FCA)

Verificar que cada CI cumple sus requisitos funcionales documentados antes de una baseline.

**Checklist FCA v2.0.0** ✅ (completado):

- [x] Todos los endpoints documentados en Swagger responden correctamente
- [x] Tests automáticos cubren los casos de uso del sílabo
- [x] Cobertura ≥ 80% verificada en CI (93.34%)
- [x] `/health` responde 200 con DB conectada
- [x] `/metrics` retorna métricas válidas de Prometheus

**Checklist FCA v2.1.0**:

- [ ] CI pipeline (6 jobs) corre correctamente en GitHub Actions
- [ ] BDD: `npm run test:bdd` → 91 escenarios pasando
- [ ] Mutation score ≥ 80%: `npm run test:mutation` → 85.67%
- [ ] GitOps: Watchtower se levanta con `docker-compose --profile prod up -d`
- [ ] Deploy workflow dispara tras CI exitoso en `main`
- [ ] Commitlint rechaza commits con formato incorrecto (`git commit -m "wip"`)
- [ ] Swagger con seguridad global: `/api/api-docs` muestra 🔒 en endpoints protegidos

### 5.2 Auditoría Física (PCA)

Verificar que el artefacto entregado coincide con la documentación.

**Checklist PCA v2.0.0**:

- [ ] `package.json` versión = tag Git
- [ ] `db/init.sql` sincronizado con el modelo de datos documentado
- [ ] `docker-compose.yml` refleja la arquitectura actual
- [ ] `.env.example` tiene todas las variables requeridas por el código
- [ ] No hay archivos sensibles (`.env`, claves) en el repositorio

---

## 6. Gestión de Releases

### 6.1 Proceso de Release

```bash
# 1. Crear branch de release desde develop
git checkout develop
git pull origin develop
git checkout -b release/v2.1.0

# 2. Actualizar versión en package.json
npm version minor --no-git-tag-version

# 3. Actualizar CHANGELOG.md

# 4. PR a main → revisión → merge con tag
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0

# 5. Merge de vuelta a develop
git checkout develop
git merge release/v2.1.0
```

### 6.2 Artefactos de Release

- Docker image: `edstone05/hc-backend:v{VERSION}` (Docker Hub)
- Release notes en GitHub Releases

---

## 7. Herramientas SCM

| Herramienta       | Uso                            | URL                  |
| ----------------- | ------------------------------ | -------------------- |
| Git 2.x           | Control de versiones           | local                |
| GitHub            | Repositorio remoto, PR, Issues | github.com/Edstone5  |
| GitHub Actions    | CI/CD pipeline                 | `.github/workflows/` |
| Vitest            | Suite de tests + cobertura     | —                    |
| Docker Hub / GHCR | Registro de imágenes           | —                    |

---

## 8. Roles y Responsabilidades

| Rol               | Responsabilidad                                         |
| ----------------- | ------------------------------------------------------- |
| **Desarrollador** | Crear branches, escribir tests, abrir PRs               |
| **Revisor (CCB)** | Revisar código, aprobar/rechazar PRs                    |
| **SCM Manager**   | Mantener este plan, gestionar releases, auditorías      |
| **DevOps**        | Mantener pipeline CI/CD, docker-compose, observabilidad |

---

_Documento bajo control de versiones en `docs/SCM_PLAN.md`. Última actualización automática via CI en cada release._
