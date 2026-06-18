# Contabilidad de Estado de Configuración (Status Accounting)

Registro vivo de cambios del proyecto **Sistema de Historia Clínica Odontológica**
(MVP v1.1). Parte del flujo de **Gobernanza del Cambio** (Laboratorio Dual S11) y de la
Sección 4 del [Plan de Gestión de Configuración](SCM_PLAN.md). Conforme a SWEBOK v4.0a e
IEEE 828-2012.

> «Un cambio no registrado no existe para una auditoría.» — SWEBOK v4.0a
> Responde: **¿qué cambió? · ¿quién lo aprobó? · ¿cuándo ocurrió?**

## Estado actual

| Campo               | Valor                                                        |
| ------------------- | ------------------------------------------------------------ |
| Línea base vigente  | `v1.1.0` (firmada GPG — ver [BASELINE.md](BASELINE.md))      |
| Rama de integración | `testeo1` (backend) · `main` (frontend)                      |
| Versión             | backend `2.1.0` · frontend `0.0.0` (MVP)                     |
| Calidad             | 1468 pruebas backend ✅ · 136 frontend ✅ · ESLint 0 errores |

## Cómo se asigna un ID de cambio (RFC)

Cada solicitud de cambio recibe un identificador `RFC-NNN` correlativo. Al abrir el PR se
registra como `open`; tras los PR Checks en verde y la aprobación de un CODEOWNER pasa a
`merged`; si el revisor lo rechaza por diseño/arquitectura, pasa a `rejected` (slide 19).

## Registro de cambios

| ID Cambio | IC afectado           | Descripción                                                                   | Aprobador (rol)               | Fecha      | Estado | Evidencia (commit)    |
| --------- | --------------------- | ----------------------------------------------------------------------------- | ----------------------------- | ---------- | ------ | --------------------- |
| RFC-101   | IC-COD-06 / IC-COD-07 | Catálogo y dibujo de hallazgos NTS-188 faltantes (sección 7)                  | Lisbeth Huanca (Calidad)      | 2026-06-01 | merged | `5dd0a6f` · `2215d86` |
| RFC-102   | IC-COD-06 / IC-COD-07 | Restauración por material NTS-188 (AM/IV/IM/IE/RT)                            | Lisbeth Huanca (Calidad)      | 2026-06-01 | merged | `48d0b9c` · `ea22f83` |
| RFC-103   | IC-COD-07             | Fix exclusión de endodoncia con label abreviado (TC/PC)                       | Edson Condemaita (Tester)     | 2026-06-02 | merged | `8b34dd1` · `60ebec5` |
| RFC-104   | IC-COD-07             | Fix flechas intrusión/extrusión (NTS-188 §6.1.24/6.1.25)                      | Edson Condemaita (Tester)     | 2026-06-03 | merged | `a1add40` · `dfc431f` |
| RFC-105   | IC-COD-03 / IC-COD-05 | Validación docente: gating por rol, endpoint de revisiones y seed             | Edgar Leyva (Scrum master)    | 2026-06-03 | merged | `92810ec` · `6cc1d8e` |
| RFC-106   | IC-CFG-03 / IC-CFG-08 | Onboarding: SETUP.md y .env.example con DATABASE_URL                          | Edgar Leyva (Scrum master)    | 2026-06-04 | merged | `39ff065`             |
| RFC-107   | IC-CFG-07 / IC-DOC    | Baseline v1.1.0 firmada GPG + bitácora SCM + clave pública                    | Edson Condemaita (Tester/SCM) | 2026-06-11 | merged | `b75f14b`             |
| RFC-108   | IC-INF-04 / IC-CFG-07 | Flujo de gobernanza S11: CI (PR Checks), branch protection, status accounting | CCB (pendiente equipo)        | 2026-06-18 | open   | _(este PR)_           |

> **Nota:** las RFC-101 a RFC-107 se registran retrospectivamente como parte de la
> consolidación de la baseline v1.1.0; sus cambios ya están integrados y firmados en la
> línea base. A partir de RFC-108, todo cambio sigue el flujo formal: PR → PR Checks →
> aprobación de CODEOWNER → merge, con protección de rama activa.

## Cadena de evidencia (trazabilidad)

```
Commit Hash  →  Pull Request  →  Aprobador (CODEOWNER)  →  Release Tag (v1.1.0)
```

Cada `RFC-NNN` es rastreable hasta su commit firmado, su PR (con los checks de CI) y la
baseline en la que se incorporó. Esto provee **integridad**, **no repudio** y **auditoría
bidireccional** (de la baseline al commit y viceversa).
