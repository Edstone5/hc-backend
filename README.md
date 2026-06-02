# HC Backend — Sistema de Historia Clínica UNJBG

[![CI](https://github.com/vaquitamarina/hc-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/vaquitamarina/hc-backend/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-93%25-brightgreen)](./coverage/index.html)
[![Node.js](https://img.shields.io/badge/node-20_LTS-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-ISC-blue)](./LICENSE)

Backend REST del sistema de historia clínica digital para estudiantes y docentes de odontología de la **Universidad Nacional Jorge Basadre Grohmann**, Tacna, Perú.

**v2.2.0** — Arquitectura Hexagonal · MySQL 8.0 · Docker · CI/CD · SRE Dashboard

---

## Características principales

| Área                 | Detalle                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| **Arquitectura**     | Hexagonal (Ports & Adapters) — 21 módulos de dominio                            |
| **Runtime**          | Node.js 20 LTS + Express 5                                                      |
| **Base de datos**    | MySQL 8.0 (schema completo en `db/init.sql`)                                    |
| **Autenticación**    | JWT + cookies HttpOnly / Argon2id                                               |
| **Tests**            | 1 389 tests unitarios + 91 escenarios BDD — cobertura **93 %**                  |
| **Mutation Testing** | Stryker — score **85.67%** (umbral alto: 80%)                                   |
| **Observabilidad**   | `/health` (liveness probe) + `/metrics` (Prometheus)                            |
| **Documentación**    | Swagger UI en `/api/api-docs` (seguridad global cookieAuth)                     |
| **CI/CD**            | GitHub Actions — 6 jobs: tests + lint + commitlint + integración + BDD + deploy |
| **GitOps**           | Watchtower pull-based + reconcile.sh + deploy.yml (ADR-0005)                    |
| **ADRs**             | 36 Architecture Decision Records en `docs/adr/`                                 |

---

## Inicio rápido

### Con Docker Compose (recomendado)

```bash
# Clona el repo
git clone https://github.com/vaquitamarina/hc-backend.git
cd hc-backend

# Configura las variables de entorno
cp .env.example .env
# Edita .env con tus valores JWT_SECRET, etc.

# Levanta MySQL + Backend + Prometheus + Grafana
docker-compose up --build
```

Servicios disponibles:

| URL                                  | Servicio                |
| ------------------------------------ | ----------------------- |
| `http://localhost:3000/api`          | REST API                |
| `http://localhost:3000/api/api-docs` | Swagger UI              |
| `http://localhost:3000/health`       | Liveness probe          |
| `http://localhost:3000/metrics`      | Métricas Prometheus     |
| `http://localhost:9090`              | Prometheus              |
| `http://localhost:3001`              | Grafana (admin / admin) |

### Desarrollo local (sin Docker)

```bash
# Instala dependencias
npm install

# Configura .env con DB_HOST=localhost y credenciales MySQL locales
cp .env.example .env

# Inicializa el esquema de BD (requiere MySQL corriendo)
npm run db:init

# Modo watch (recarga automática)
npm run dev
```

---

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```bash
DB_HOST=localhost          # "mysql" si usas Docker Compose
DB_USER=hc_user
DB_PASSWORD=hc_password
DB_NAME=hc_db
DB_PORT=3306

JWT_SECRET=<genera con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<otro valor aleatorio>

PORT=3000
NODE_ENV=development
```

---

## Tests y cobertura

```bash
# Todos los tests (modo interactivo)
npm test

# Con reporte de cobertura
npm run test:ci

# Ver reporte HTML de cobertura
open coverage/index.html

# Pruebas de mutación (Stryker)
npm run test:mutation
```

Cobertura actual (excluyendo capa de infraestructura — ver ADR-0003):

```
All files  |  93.34 %  Stmts  |  89.92 %  Branch  |  83.18 %  Funcs
```

---

## Estructura del proyecto

```
hc-backend/
├── api.js                      # Entry point: Express + Swagger + métricas
├── db/
│   ├── db.js                   # Pool MySQL (wrapper pg → mysql2)
│   └── init.sql                # Schema + stored procedures + seed data
├── routes/
│   ├── index.js                # Router raíz /api
│   ├── healthRoutes.js         # GET /health
│   ├── metricsRoutes.js        # GET /metrics (Prometheus)
│   ├── hcRoutes.js             # Historia clínica + todos los módulos
│   ├── userRoutes.js           # Auth + usuarios
│   ├── patientRoutes.js        # Pacientes
│   └── ...
├── {modulo}/                   # Por cada uno de los 21 módulos de dominio:
│   ├── domain/                 #   Value Objects, Aggregates, I*Repository
│   ├── application/            #   Controller (adaptador primario)
│   └── infrastructure/         #   *Repository (adaptador secundario)
│   # Módulos: hc, filiacion, motivoConsulta, enfermedadActual, antecedente,
│   # examenGeneral, examenRegional, examenBoca, higieneBocal, diagnosticoPresuntivo,
│   # diagnosticoClinicas, derivacionClinicas, evolucion, odontograma, prescripcion,
│   # adjunto, fichaOperacion, fichaEvaluacion, cita, pago, consentimiento (RF-09 ✅)
├── middlewares/
│   ├── authMiddleware.js       # JWT cookie validation
│   └── prometheusMiddleware.js # Instrumentación automática HTTP
├── services/
│   ├── tokenService.js
│   └── cookieServices.js
├── docs/                       # Swagger JSDoc + documentación
│   ├── adr/                    # 22 Architecture Decision Records
│   ├── SCM_PLAN.md             # IEEE 828 SCM Plan
│   ├── SLO.md                  # Service Level Objectives
│   ├── SAD.md                  # Software Architecture Document
│   ├── GIT_FLOW.md             # Guía de Git Flow
│   └── GLOSARIO_LENGUAJE_UBICUO.md
├── observability/
│   ├── prometheus.yml          # Config de scrape
│   └── grafana/                # Datasource + dashboard provisioning
├── test/                       # 79 archivos de test (Vitest)
├── .github/workflows/ci.yml    # CI/CD: tests + lint + integración + deploy
├── docker-compose.yml          # MySQL + Backend + Frontend + Prometheus + Grafana
├── Dockerfile
├── commitlint.config.js        # Conventional Commits enforcement
└── .husky/                     # Git hooks: pre-commit (lint) + commit-msg
```

---

## API REST — Endpoints principales

| Método     | Ruta                                      | Descripción                                                                                                                                                  |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST`     | `/api/users/login`                        | Iniciar sesión                                                                                                                                               |
| `POST`     | `/api/users/register`                     | Registrar usuario                                                                                                                                            |
| `POST`     | `/api/users/refresh`                      | Renovar access token y **rotar** el refresh token (cookie); detecta reúso (ADR-0028)                                                                         |
| `GET`      | `/api/users/me`                           | Usuario autenticado                                                                                                                                          |
| `POST`     | `/api/patients`                           | Crear paciente                                                                                                                                               |
| `POST`     | `/api/hc/draft`                           | Obtener/crear borrador HC                                                                                                                                    |
| `PATCH`    | `/api/hc/assign-patient`                  | Asignar paciente a HC                                                                                                                                        |
| `GET`      | `/api/hc/:id/patient`                     | Paciente de una HC                                                                                                                                           |
| `GET/PUT`  | `/api/hc/filiacion/historia/:id`          | Datos personales                                                                                                                                             |
| `GET/PUT`  | `/api/hc/:id/examen-general`              | Examen físico general                                                                                                                                        |
| `GET/PUT`  | `/api/hc/:id/examen-boca`                 | Examen clínico bucal                                                                                                                                         |
| `GET/PUT`  | `/api/hc/:id/higiene`                     | Higiene oral (IHOS)                                                                                                                                          |
| `GET/PUT`  | `/api/hc/:id/diagnostico-presuntivo`      | Diagnóstico presuntivo                                                                                                                                       |
| `GET/POST` | `/api/hc/:id/evolucion`                   | Evolución del tratamiento                                                                                                                                    |
| `GET/POST` | `/api/hc/:id/consentimiento`              | Consentimientos (RF-09) ✅                                                                                                                                   |
| `DELETE`   | `/api/hc/:id/consentimiento/:id`          | Eliminar consentimiento                                                                                                                                      |
| `POST`     | `/api/hc/:id/exportar-pdf`                | Auditar exportación PDF (RF-08) ✅                                                                                                                           |
| `GET`      | `/api/hc/:id/auditoria`                   | Log de auditoría por HC                                                                                                                                      |
| `GET/POST` | `/api/hc/:id/odontograma`                 | Entradas odontograma (RF-06) — POST valida exclusión de pieza ausente (409, ADR-0021)                                                                        |
| `GET`      | `/api/hc/odontograma/reporte/prevalencia` | Reporte agregado multi-paciente: prevalencia de caries (global y por diente) + CPO-D promedio (RF-12, ADR-0026). Filtros: `tipo`, `alumno`, `desde`, `hasta` |
| `GET/POST` | `/api/hc/:id/prescripciones`              | Historial medicamentos (RF-07)                                                                                                                               |
| `GET/POST` | `/api/hc/:id/adjuntos`                    | Archivos adjuntos (RF-05)                                                                                                                                    |
| `GET/POST` | `/api/hc/:id/citas`                       | Citas y agenda (RF-11)                                                                                                                                       |
| `GET/POST` | `/api/hc/:id/fichas-operacion`            | Fichas de operación (RF-18)                                                                                                                                  |
| `GET`      | `/api/catalogo/:nombre`                   | Catálogos clínicos                                                                                                                                           |
| `GET`      | `/health`                                 | Liveness probe                                                                                                                                               |
| `GET`      | `/metrics`                                | Métricas Prometheus                                                                                                                                          |

> ✅ Endpoints añadidos en v2.2.0

Documentación completa interactiva: **`http://localhost:3000/api/api-docs`**

---

## Convención de commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/).
El hook `commit-msg` (Husky + commitlint) bloquea commits que no cumplan el formato:

```
<type>(<scope>): <descripción en imperativo, minúsculas>

Refs #42
```

Tipos: `feat` | `fix` | `docs` | `refactor` | `test` | `chore` | `ci` | `perf`

Activa la plantilla: `git config commit.template .gitmessage`

---

## Observabilidad

```bash
# Verificar que el servidor está sano
curl http://localhost:3000/health

# Ver métricas en formato Prometheus
curl http://localhost:3000/metrics | head -20

# Dashboard Grafana (pre-configurado, no requiere setup manual)
open http://localhost:3001
# Login: admin / admin
# Dashboard: "HC Backend — SRE Dashboard"
```

---

## Documentación técnica

| Documento                                                                                              | Descripción                                             |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| [`docs/SAD.md`](./docs/SAD.md)                                                                         | Software Architecture Document (vistas C4, ADRs)        |
| [`docs/SCM_PLAN.md`](./docs/SCM_PLAN.md)                                                               | Plan IEEE 828 de Gestión de Configuración               |
| [`docs/SLO.md`](./docs/SLO.md)                                                                         | Service Level Objectives (disponibilidad, latencia)     |
| [`docs/GIT_FLOW.md`](./docs/GIT_FLOW.md)                                                               | Guía de trabajo con Git Flow                            |
| [`docs/adr/`](./docs/adr/)                                                                             | Architecture Decision Records (ADR-0001 a **ADR-0036**) |
| [`docs/adr/0006-consentimiento-informado-rf09.md`](./docs/adr/0006-consentimiento-informado-rf09.md)   | ADR-0006: Módulo Consentimiento Informado               |
| [`docs/adr/0007-exportacion-pdf-rf08.md`](./docs/adr/0007-exportacion-pdf-rf08.md)                     | ADR-0007: Mejora exportación PDF                        |
| [`docs/adr/0008-consolidacion-odontograma-rf06.md`](./docs/adr/0008-consolidacion-odontograma-rf06.md) | ADR-0008: Consolidación Odontograma                     |
| [`CHANGELOG.md`](./CHANGELOG.md)                                                                       | Historial de cambios (Keep a Changelog) — **v2.2.0**    |
| [`db/migrations/`](./db/migrations/)                                                                   | Migraciones SQL para instancias existentes              |

---

## Convenciones de respuesta HTTP

| Situación                       | Código                      |
| ------------------------------- | --------------------------- |
| Lectura exitosa                 | `200 OK`                    |
| Creación exitosa                | `201 Created`               |
| Error de validación / dominio   | `400 Bad Request`           |
| No autenticado                  | `401 Unauthorized`          |
| Recurso no encontrado           | `404 Not Found`             |
| Conflicto (DNI duplicado, etc.) | `409 Conflict`              |
| Error interno                   | `500 Internal Server Error` |
| BD no disponible                | `503 Service Unavailable`   |

---

_Proyecto académico — Ingeniería de Software II 2026-I, UNJBG._
