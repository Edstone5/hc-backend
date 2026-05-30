# Software Architecture Document (SAD)

**Proyecto**: Sistema de Historia Clínica — UNJBG  
**Versión**: 2.0.0 | **Fecha**: 2026-05 | **Estándar**: ISO/IEC/IEEE 42010

---

## 1. Introducción

### 1.1 Propósito

Este documento describe la arquitectura del sistema HC-UNJBG v2.0.0, las decisiones arquitectónicas tomadas, los patrones aplicados y las vistas del sistema desde diferentes perspectivas de stakeholders.

### 1.2 Alcance

Sistema de historia clínica digital para estudiantes y docentes de odontología de la Universidad Nacional Jorge Basadre Grohmann (UNJBG), Tacna, Perú.

### 1.3 Stakeholders y sus preocupaciones

| Stakeholder                | Preocupación principal                       |
| -------------------------- | -------------------------------------------- |
| Estudiantes de odontología | Facilidad de uso, velocidad de carga         |
| Docentes                   | Revisión de historias, confiabilidad         |
| Administración TI          | Despliegue, mantenimiento, seguridad         |
| Equipo de desarrollo       | Mantenibilidad, testabilidad, extensibilidad |

---

## 2. Restricciones y Requisitos Arquitectónicos

| ID    | Restricción / Requisito                                     |
| ----- | ----------------------------------------------------------- |
| AR-01 | Node.js 20 LTS como runtime de backend                      |
| AR-02 | React 18 + Vite para el frontend                            |
| AR-03 | MySQL 8.0 como base de datos relacional                     |
| AR-04 | Cobertura de tests ≥ 80% (sílabo IS II 2026-I)              |
| AR-05 | Arquitectura Hexagonal (Ports & Adapters) — ADR-0001        |
| AR-06 | API REST sin estado (stateless) con JWT en cookies HttpOnly |
| AR-07 | Despliegue en contenedores Docker                           |
| AR-08 | Métricas expuestas en formato Prometheus                    |

---

## 3. Vistas Arquitectónicas

### 3.1 Vista de Contexto (C4 — Nivel 1)

```
┌─────────────────────────────────────────────────────────────┐
│                     SISTEMA HC-UNJBG                        │
│                                                             │
│  ┌─────────────┐      REST/JSON      ┌──────────────────┐  │
│  │  Estudiante │◄────────────────────►│   HC Frontend    │  │
│  │  Docente    │     (React SPA)      │   (Vite + React) │  │
│  └─────────────┘                     └────────┬─────────┘  │
│                                               │             │
│                                         HTTP/JSON           │
│                                               │             │
│                                      ┌────────▼─────────┐  │
│                                      │   HC Backend     │  │
│                                      │ (Node/Express)   │  │
│                                      └──┬───────────┬───┘  │
│                                         │           │       │
│                                      MySQL 8.0  Prometheus  │
│                                      (datos)    (métricas)  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Vista de Contenedores (C4 — Nivel 2)

```
┌─── Docker Network: hc_network ──────────────────────────────────────┐
│                                                                      │
│  hc_frontend     hc_backend      hc_mysql    hc_prometheus hc_grafana│
│  (React:5173) ──► (Express:3000) ──► (MySQL:3306)                   │
│                        │                                             │
│                        ├── /health   → liveness probe               │
│                        ├── /metrics  → Prometheus scrape ──────────► │
│                        └── /api/*    → business logic               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Vista de Componentes — Backend (C4 — Nivel 3)

El backend aplica **Arquitectura Hexagonal (Ports & Adapters)**:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ADAPTADORES PRIMARIOS (Driving)        │  ADAPTADORES SECUNDARIOS  │
│  ─────────────────────────────          │  (Driven)                 │
│                                         │                           │
│  Express Router ──► *Controller.js      │  *Repository.js           │
│  (HTTP)               (Application)     │  (Infrastructure)         │
│                              │          │         │                 │
│  ──────────────── DOMINIO ───────────── │ ─────── │ ────────────── │
│                              │          │         │                 │
│                    *Domain.js           │    MySQL 8.0              │
│                    (Value Objects       │    (pool.query)           │
│                     Aggregates          │                           │
│                     DomainError)        │                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Módulos de dominio implementados** (18 módulos):

| Módulo                  | Dominio                   | Casos de uso                              |
| ----------------------- | ------------------------- | ----------------------------------------- |
| `user`                  | Usuarios del sistema      | Registrar, listar, obtener por ID         |
| `auth`                  | Autenticación             | Login con argon2, JWT, logout             |
| `patient`               | Pacientes                 | Crear, actualizar                         |
| `hc`                    | Historia Clínica          | Crear borrador, asignar paciente, revisar |
| `filiacion`             | Datos personales          | CRUD filiación                            |
| `antecedente`           | Antecedentes (4 tipos)    | CRUD por tipo                             |
| `motivoConsulta`        | Motivo de consulta        | CRUD                                      |
| `enfermedadActual`      | Enfermedad actual         | CRUD                                      |
| `examenGeneral`         | Examen físico general     | CRUD                                      |
| `examenRegional`        | Examen físico regional    | CRUD                                      |
| `examenBoca`            | Examen clínico bucal      | Consultar, actualizar                     |
| `higieneBocal`          | Higiene bucal (IHOS)      | Consultar, actualizar                     |
| `diagnosticoPresuntivo` | Diagnóstico presuntivo    | Consultar, actualizar                     |
| `diagnosticoClinicas`   | Diagnóstico clínicas      | Consultar, actualizar                     |
| `evolucion`             | Evolución del tratamiento | Consultar, registrar                      |
| `derivacionClinicas`    | Derivación a clínicas     | Consultar, actualizar                     |
| `catalogo`              | Catálogos clínicos        | Listar opciones por nombre                |
| `listaHcAdultos`        | Listado de historias      | Listar por estudiante                     |
| `studentUsers`          | Usuarios estudiante       | Listar todos                              |

### 3.4 Vista de Despliegue

```
Servidor VPS (Ubuntu)
│
├── Docker Engine
│    ├── hc_frontend  (puerto 5173 → 80/443 via nginx reverse proxy)
│    ├── hc_backend   (puerto 3000, interno + expuesto)
│    ├── hc_mysql     (puerto 3306, solo red interna Docker)
│    ├── hc_prometheus (puerto 9090, red interna)
│    └── hc_grafana   (puerto 3001)
│
└── GitHub Actions (CI/CD)
     ├── push a develop → tests + coverage
     └── push a main   → tests + build + deploy
```

---

## 4. Decisiones Arquitectónicas (ADRs)

### ADR-0001: Arquitectura Hexagonal

**Estado**: Aceptado  
**Contexto**: Necesitamos separar la lógica de negocio de la tecnología de persistencia y el framework HTTP para facilitar el testing y el cambio tecnológico.  
**Decisión**: Aplicar Ports & Adapters. El dominio no conoce a Express ni a MySQL.  
**Consecuencias**: Mayor código boilerplate (+). Alta testabilidad sin BD (+). Curva de aprendizaje (-).

### ADR-0002: MySQL 8.0 sobre PostgreSQL

**Estado**: Aceptado  
**Contexto**: El sistema inició con NeonDB (PostgreSQL serverless). El sílabo requiere demostrar control de BD.  
**Decisión**: Migrar a MySQL 8.0 ejecutado en Docker con schema definido en `init.sql`.  
**Consecuencias**: Stored procedures en MySQL (+). Sin dependencia de servicios externos (+). Migración requerida (-).

### ADR-0003: JWT en cookies HttpOnly sobre Authorization header

**Estado**: Aceptado  
**Contexto**: Las SPAs son vulnerables a XSS cuando guardan tokens en localStorage.  
**Decisión**: Usar cookies HttpOnly + SameSite=Strict para almacenar el JWT.  
**Consecuencias**: Protección contra XSS (+). Requiere CORS configurado correctamente (-).

### ADR-0004: prom-client para métricas Prometheus

**Estado**: Aceptado  
**Contexto**: El sílabo (Semana 14) requiere un SRE Dashboard.  
**Decisión**: Usar `prom-client` para exponer métricas en `/metrics` y Grafana para visualización.  
**Consecuencias**: Observabilidad sin costo extra (+). Un servicio más en docker-compose (-).

---

## 5. Patrones de Diseño Aplicados

| Patrón               | Dónde se aplica                   | Propósito                         |
| -------------------- | --------------------------------- | --------------------------------- |
| **Repository**       | `*/infrastructure/*Repository.js` | Abstrae el acceso a datos         |
| **Value Object**     | `*/domain/*.js`                   | Encapsula validaciones de negocio |
| **Aggregate Root**   | `*/domain/*Aggregate.js`          | Punto de entrada al dominio       |
| **Adapter**          | `*/application/*Controller.js`    | Traduce HTTP ↔ dominio           |
| **Singleton**        | `db/db.js` (pool)                 | Una sola instancia del pool MySQL |
| **Middleware chain** | `middlewares/`                    | Autenticación, Prometheus, CORS   |

---

## 6. Calidad del Software

### 6.1 Métricas actuales (v2.0.0)

| Métrica                 | Valor  | Objetivo |
| ----------------------- | ------ | -------- |
| Cobertura de statements | 93.21% | ≥ 80%    |
| Cobertura de branches   | 90.20% | ≥ 80%    |
| Tests unitarios         | 1,276  | —        |
| Test files              | 77     | —        |
| Módulos de dominio      | 18     | —        |

### 6.2 Estrategia de testing

```
               ┌──────────────────────────────┐
               │  Tests E2E (futuro Playwright)│  ← Pocos, lentos, costosos
               ├──────────────────────────────┤
               │  Tests de integración         │  ← CI con MySQL real
               │  (GitHub Actions + MySQL)     │
               ├──────────────────────────────┤
               │  Tests unitarios              │  ← Muchos, rápidos
               │  Vitest + mocks               │  1276 tests (ACTUAL)
               └──────────────────────────────┘
```

---

## 7. Seguridad

| Aspecto            | Implementación                                    |
| ------------------ | ------------------------------------------------- |
| Autenticación      | JWT firmado con HS256, expiración 1h              |
| Almacenamiento JWT | Cookie HttpOnly, SameSite=Strict                  |
| Contraseñas        | Argon2id (resistente a GPU)                       |
| CORS               | Lista blanca de orígenes en `api.js`              |
| Headers            | `x-powered-by` deshabilitado                      |
| BD                 | Usuario MySQL con mínimos privilegios (`hc_user`) |
| Secrets            | Variables de entorno, nunca en código             |

---

_Documento bajo control de versiones en `docs/SAD.md`. Actualizar con cada baseline._
