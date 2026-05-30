# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

---

## [2.1.0] — 2026-05

> **Baseline BL-03** — GitOps completo + Mutation Testing mejorado + CI de 6 jobs.
> Completa los requisitos del sílabo IS II 2026-I Semanas 9-16.

### Añadido

- **GitOps completo** (ADR-0005): implementación de los 4 principios OpenGitOps sobre
  Docker Compose + VPS. Antes el pipeline era push-based (CI publicaba imagen pero nadie
  desplegaba automáticamente). Ahora:
  - `Watchtower` en `docker-compose.yml` — agente pull-based que monitorea GHCR cada 30s
    y reinicia el backend con zero-downtime cuando detecta imagen más nueva.
  - `.github/workflows/deploy.yml` — workflow de deploy vía SSH para primer deploy y
    rollbacks manuales; se dispara automáticamente cuando el CI principal completa con éxito.
  - `scripts/reconcile.sh` — agente de reconciliación con rollback automático: si `/health`
    no responde 200 tras un deploy, revierte al commit anterior y restaura el servicio.
  - `scripts/hc-reconcile.service` + `hc-reconcile.timer` — unidades systemd para ejecutar
    el agente de reconciliación cada 5 minutos en el VPS sin intervención humana.

- **CI ampliado a 6 jobs** (`.github/workflows/ci.yml`):
  - Job 4: `BDD — Cucumber (91 escenarios)` — ejecuta los escenarios Gherkin en cada PR.
    Antes solo corría localmente con `npx cucumber-js`.
  - Job 5: `Mutation Testing — Stryker` — ejecuta semanalmente (cron lunes 3 AM UTC)
    sobre los 19 módulos de dominio. No bloquea PRs; genera reporte HTML como artefacto.
  - Job 6: `Build & Push Docker image` — ahora usa `needs: [backend-tests, bdd, integration]`
    para garantizar que todos los checks pasen antes de publicar en GHCR.

- **`npm run test:bdd`** — script añadido a `package.json`. Antes no había forma estándar
  de ejecutar los tests Cucumber; había que usar `npx cucumber-js` directamente.

- **Commitlint** (`commitlint.config.js`, `.husky/commit-msg`):
  - Valida que todos los commits sigan Conventional Commits antes del push.
  - Bloquea mensajes como "fix cosas" o "wip".
  - Validación también en CI para PRs (job lint, paso `Validate commit messages`).

- **Swagger con seguridad global** (`api.js`): añadido `security: [{ cookieAuth: [] }]`
  a nivel de definición OpenAPI. Todos los endpoints heredan automáticamente el esquema
  `cookieAuth`; solo `POST /login`, `POST /register`, `GET /health` y `GET /metrics`
  sobreescriben con `security: []` (sin autenticación requerida).

- **Tests dirigidos por mutación** — 107 tests nuevos (1389 total vs 1282 anterior):
  - `test/examenRegional.domain.test.js`: +66 tests (116 total). Atacaban principalmente
    mutantes `LogicalOperator` (`||` → `&&`) en los 43 campos dual alias del dominio.
    Score: 75.27% → **92.00%** (+16.7 pp).
  - `test/examenBoca.domain.test.js`: +18 tests (58 total). Snake_case aliases para los
    14 campos no cubiertos; tests de `normalizePrimitive` con null/undefined/número/cadena.
    Score: 76.76% → **87.57%** (+10.8 pp).
  - `test/derivacionClinicas.domain.test.js`: +20 tests (31 total). Mensajes exactos de
    error para matar `StringLiteral`; `undefined` en `DestinosValueObject` para matar
    `LogicalOperator`; `stripHCPrefix` con falsy values para matar `BlockStatement`.
    Score: 66.13% → **76.61%** (+10.5 pp).
  - `test/hc.domain.test.js`: +30 tests (71 total). Mensajes exactos en `_normalizeUuid`;
    test de `_normalizePrimitive` con número (kills `ConditionalExpression` en typeof check);
    pruebas de límite exacto (80 chars) para matar `EqualityOperator` en `EstadoRevisionVO`.
    Score: 72.64% → **80.19%** (+7.6 pp).

- **ADR-0005** (`docs/adr/0005-gitops-deployment.md`): decisión arquitectónica documentada
  comparando GitOps vs CI/CD tradicional (push vs pull), alternativas descartadas
  (Argo CD/Flux — overkill para VPS), y justificación de Watchtower + reconcile.sh.

- **`docs/GUIA_NO_PROGRAMABLE.md`**: guía para actividades del sílabo que no se traducen
  en código (Event Storming, Context Map, auditorías FCA/PCA, demos).

- **Swagger docs completos** — 5 nuevos archivos de documentación:
  `authEndpoints.js`, `patientEndpoints.js`, `hcCoreEndpoints.js`, `examenes.js`,
  `hcCoreEndpoints.js`. Ahora todos los endpoints del sistema tienen documentación
  interactiva en `/api/api-docs`.

### Cambiado

- **`package.json` v2.1.0**: versión bump; nuevos scripts `test:bdd`, `start:prod`,
  `db:init`; descripción del proyecto actualizada.

- **`README.md`**: reescrito completamente — estructura de proyecto, tabla de métricas,
  instrucciones Docker, variables de entorno, comandos de observabilidad.

- **`docs/adr/README.md`**: actualizado con ADR-0004 y ADR-0005.

- **`.gitignore`**: añadidos `coverage/`, `reports/`, `.stryker-tmp/`, volúmenes Docker.

- **`docker-compose.yml`**: label `com.centurylinklabs.watchtower.scope=gitops` añadido
  al servicio `backend`; variable `BACKEND_IMAGE` para permitir usar imagen de GHCR
  en producción sin reconstruir desde Dockerfile; servicio `watchtower` con profile `prod`.

### Métricas finales (v2.1.0)

| Métrica               | v2.0.0 | v2.1.0     |
| --------------------- | ------ | ---------- |
| Tests Vitest          | 1 282  | **1 389**  |
| Tests Cucumber (BDD)  | 91     | **91**     |
| Cobertura statements  | 93.34% | **93.34%** |
| Mutation score global | 81.23% | **85.67%** |
| Jobs CI/CD            | 4      | **6**      |
| ADRs documentados     | 4      | **5**      |

---

## [2.0.0] — 2026-05

> **Baseline BL-02** — MVP v2.0 con MySQL + CI/CD + SRE + Documentación completa.
> Cumple los requisitos del **Producto 2** del sílabo IS II 2026-I (Semanas 9-16).

### Añadido

- **SRE — `/health` endpoint** (`routes/healthRoutes.js`): liveness + readiness probe,
  responde 200/503 según disponibilidad de MySQL. Documentado en Swagger.
  Usado como healthcheck en Docker Compose para el servicio `backend`.

- **SRE — `/metrics` endpoint** (`routes/metricsRoutes.js`): métricas Prometheus
  con `prom-client`. Incluye métricas Node.js por defecto (GC, heap, event-loop)
  y custom de negocio (`http_requests_total`, `http_request_duration_seconds`,
  `active_connections`, `domain_errors_total`).

- **SRE — `prometheusMiddleware`** (`middlewares/prometheusMiddleware.js`):
  instrumenta automáticamente todas las rutas HTTP con contador e histograma.
  Normaliza UUIDs en labels para evitar alta cardinalidad.

- **SRE — Prometheus + Grafana en Docker Compose**: servicio `prometheus` con
  scrape cada 15s y `grafana` con datasource + dashboard pre-configurados
  mediante provisioning (`observability/`). Dashboard "HC Backend — SRE Dashboard"
  con 6 paneles (requests, latencia P50/P95/P99, errores 5xx, heap).

- **CI/CD — GitHub Actions** (`.github/workflows/ci.yml`): 4 jobs —
  (1) unit tests + cobertura ≥ 80%, (2) lint, (3) integration smoke test con
  MySQL real que verifica `/health` y `/metrics`, (4) build + push imagen Docker
  a GHCR en merge a `main`.

- **Cobertura de tests**: 63% → **93.34%** (1282 tests, 79 archivos).
  11 archivos nuevos de test para controladores hexagonales de la capa de aplicación.

- **Swagger/OpenAPI mejorado** (`api.js`): versión 2.0.0, servers, schemas de
  componentes (HealthOk, HealthError), securitySchemes (cookieAuth). Nuevos docs:
  `authEndpoints.js`, `patientEndpoints.js`, `hcCoreEndpoints.js`,
  `examenes.js` (examen bucal, higiene oral, examen general/regional).

- **SCM — IEEE 828** (`docs/SCM_PLAN.md`): Plan de Gestión de Configuración con
  identificación de CIs, esquema de versiones, Git Flow, proceso CCR, baselines,
  auditorías FCA/PCA, política de releases.

- **SCM — Git Flow** (`docs/GIT_FLOW.md`, `.gitmessage`): guía de ramas,
  Conventional Commits, plantilla de commit que se activa con `git config
commit.template .gitmessage`.

- **SLOs** (`docs/SLO.md`): 8 SLOs definidos — disponibilidad (99%), latencia P95
  (≤500ms), cobertura (≥80%), startup (≤60s), Error Budget Policy.

- **SAD** (`docs/SAD.md`): Software Architecture Document con vistas C4 (contexto,
  contenedores, componentes), 4 ADRs, patrones de diseño, tabla de 18 módulos
  de dominio, métricas de calidad actuales.

- **ADR-0004** (`docs/adr/0004-observabilidad-prometheus-grafana.md`): decisión
  de usar prom-client + Prometheus + Grafana para observabilidad.

- **`db/init.sql`**: esquema MySQL completo con 33 tablas, ~30 stored procedures
  y seed data para 15 catálogos clínicos con valores del contexto peruano.

- **`.env.example`**: plantilla con todas las variables de entorno necesarias.

### Cambiado

- **`docker-compose.yml`**: reescrito — MySQL como servicio primario con
  healthcheck, backend `depends_on` MySQL con condición `service_healthy`,
  healthcheck del backend apunta a `/health`, nuevos servicios `prometheus`
  y `grafana` con volúmenes persistentes.

- **`.env`**: migrado de URL NeonDB/PostgreSQL a variables MySQL individuales
  (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).

- **`vitest.config.js`**: excluye `**/infrastructure/**`, `db/`, `controllers/`
  y `models/` del coverage (arquitectura hexagonal correcta); reporters: text,
  html, lcov, **json-summary** (requerido por CI threshold check).

- **`api.js`**: mountea `/health` y `/metrics` antes del prefijo `/api`;
  aplica `prometheusMiddleware` a todas las rutas; Swagger actualizado a
  OpenAPI 3.0 con servidores, componentes y security schemes.

---

## [No publicado — histórico]

### Cambiado — Fase 2: Migración de PostgreSQL a MySQL

- **[ADR-0003]** Reemplazado el driver `pg` por `mysql2` en las dependencias
  del proyecto (`package.json`). El driver `pg` ya no es una dependencia del
  sistema.

- **[ADR-0003 §2a]** Reescrito `db/db.js` con un wrapper de compatibilidad
  `mysql2/promise → { rows }`. El wrapper normaliza los tres tipos de respuesta
  que devuelve mysql2 (SELECT, CALL con SELECT, CALL sin SELECT / DML) al
  mismo formato `{ rows }` que ya usaban los 19 repositorios, minimizando los
  cambios en la capa de infraestructura. Ver tabla de normalización en ADR-0003.

- **[ADR-0003 §2b]** `testConnection` rediseñada para usar `pool.query('SELECT 1')`
  en lugar de `pool.getConnection()`, preservando la capacidad de mockeo en
  tests unitarios sin servidor real.

- **[ADR-0003 §3a]** Migrados los 19 repositorios de infraestructura a sintaxis
  MySQL. Placeholders `$1, $2, …, $N` → `?`; type-casts inline eliminados
  (`::uuid`, `::date`, `::varchar`, `::text`, `::jsonb`).

- **[ADR-0003 §3b]** `ORDER BY … DESC NULLS LAST` →
  `ORDER BY … IS NULL, … DESC` en los repositorios `diagnosticoPresuntivo`
  y `diagnosticoClinicas`. MySQL no implementa la cláusula NULLS LAST; la
  expresión `campo IS NULL` (evalúa 0/1) produce el mismo comportamiento.

- **[ADR-0003 §3c]** `INSERT … RETURNING *` reemplazado por INSERT + SELECT
  consecutivo en `examenGeneral` y `examenRegional`. MySQL no soporta
  RETURNING; se consulta la fila recién insertada por `id_historia` (params[0]).

- **[ADR-0003 §3d]** Funciones PostgreSQL set-returning (`SELECT * FROM fn_()`)
  convertidas a `CALL proc()` en `hc`, `user`, `auth` y `listaHcAdultos`.
  Funciones escalares (`SELECT fn_() AS alias`) mantenidas sin cambio en
  `hc` (obtenerBorrador) y `patient` (crearPaciente), ya que MySQL las soporta
  nativamente con la misma sintaxis.

- **[ADR-0003]** Actualizado `test/db.test.js`: el mensaje esperado cambia
  de `"Conectado a Postgres"` a `"Conectado a MySQL"`.

### Demostración de Arquitectura Hexagonal (Fase 2)

El siguiente comando devuelve **sin output** tras la migración:

```bash
grep -rn "mysql2\|from '../../db/db.js'" --include="*.js" \
     --exclude-dir=node_modules | grep -v "infrastructure" | grep -v "db/db.js"
```

Ningún archivo de dominio (`*/domain/*.js`) ni de aplicación
(`*/application/*.js`) referencia el driver de base de datos ni el pool.
La tecnología de persistencia se intercambió sin modificar el núcleo del sistema.

---

### Corregido — Fase 1: Corrección de violaciones hexagonales

- **[ADR-0001]** Eliminado `import pool` del dominio de `hc` (`hc/domain/hcDomain.js`).
  El import era declarativo (pool nunca se invocaba) pero creaba un acoplamiento
  explícito entre la capa de dominio y la infraestructura de base de datos.

- **[ADR-0001]** Eliminado `import pool` del dominio de `diagnosticoClinicas`
  (`diagnosticoClinicas/domain/diagnosticoClinicasDomain.js`). Mismo caso.

- **[ADR-0001]** Eliminados `import pool` y funciones SQL exportadas del dominio
  de `evolucion` (`evolucion/domain/evolucionDomain.js`). Las funciones
  `consultarEvoluciones()` y `registrarEvolucion()` contenían llamadas directas
  a `pool.query()` dentro de la capa de dominio. El controlador ya usaba el
  repositorio equivalente (`EvolucionRepository`); las funciones eran código
  muerto con dependencia hacia infraestructura.

- **[ADR-0001]** Eliminados `import pool` y funciones SQL exportadas del dominio
  de `diagnosticoPresuntivo` (`diagnosticoPresuntivo/domain/diagnosticoPresuntivoDomain.js`).
  Las funciones `consultarDiagnosticoPresuntivo()` y
  `actualizarDiagnosticoPresuntivo()` repetían el mismo antipatrón.

- **[ADR-0001]** Eliminada importación muerta
  `consultarDiagnosticoPresuntivo as domainConsultar` del controlador
  `diagnosticoPresuntivo/application/diagnosticoPresuntivoController.js`.

### Añadido — Fase 1: Puertos de persistencia explícitos

- **[ADR-0002]** Interfaces de puerto (`I*Repository`) añadidas a los 19 módulos
  de dominio. Cada interfaz define, mediante una clase abstracta, el contrato que
  los adaptadores secundarios deben cumplir. Permite intercambiar la tecnología
  de base de datos sin modificar dominio ni aplicación.

- **[ADR-0002]** Los 19 repositorios de infraestructura extienden ahora su
  interfaz de puerto correspondiente. Establece la dependencia formal
  infraestructura → dominio (dirección correcta en Arquitectura Hexagonal).

- Carpeta `docs/adr/` con tres Registros de Decisión de Arquitectura (ADRs):
  - `ADR-0001` Corrección de violaciones de la capa de dominio
  - `ADR-0002` Introducción de interfaces de puerto en la capa de dominio
  - `ADR-0003` Migración de PostgreSQL a MySQL (implementado ✅)
