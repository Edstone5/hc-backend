# ADR-0013 — Módulo EPB / PSR (Examen Periodontal Básico)

**Estado:** Aceptado ✅
**Fecha:** 2026-05-30
**Decididores:** Equipo Grupo 4
**Requisito cubierto:** Flujo de atención MINSA / periodoncia
**Norma aplicable:** PSR (Periodontal Screening and Recording) — códigos OMS

---

## Contexto

La clínica UNJBG realiza tratamiento periodontal; el flujo MINSA incluye el
**Examen Periodontal Básico (EPB / PSR)**: se divide la boca en 6 sextantes y a
cada uno se le asigna un código OMS 0-4 (sano → bolsa ≥ 6 mm), con marcadores de
furca y movilidad. No existía en el sistema.

## Decisión

1. **Módulo DDD nuevo `epb/`** (mismo patrón que `ihoSimplificado`).
2. **Tabla `epb`** (migración 005): 6 sextantes como JSON (`valores`) +
   `codigo_max` (peor código, para resumen y reportes).
3. **Validación en el dominio** (`EpbAggregate`): sextante ∈ {1..6} (sin
   duplicados), código ∈ [0,4], furca/movilidad booleanos; calcula `codigoMax`.
4. **UI:** componente separado `EpbPanel.jsx` dentro de la vista Odontograma,
   con selector de código por sextante (coloreado), checkboxes F/M y resumen.

## Opciones consideradas

| Opción                                   | Resultado                                                        |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Tabla normalizada `epb` + `epb_sextante` | Rechazada: 6 sextantes fijos; JSON + `codigo_max` es suficiente. |
| Registrar EPB dentro del odontograma     | Rechazada: distinto dominio clínico; mejor módulo propio.        |
| **Módulo nuevo + `epb` (elegida)**       | Aislado, validable, reportable.                                  |

## Cambios realizados

### Backend

| Archivo                                           | Cambio                                   |
| ------------------------------------------------- | ---------------------------------------- |
| `epb/domain/epbDomain.js`                         | **Nuevo.** `EpbAggregate`, `SEXTANTES`.  |
| `epb/infrastructure/epbRepository.js`             | **Nuevo.** consultar/guardar (JSON).     |
| `epb/application/epbController.js`                | **Nuevo.** GET/POST.                     |
| `routes/hcRoutes.js`                              | Rutas `GET/POST /:id/epb`.               |
| `db/migrations/005_examen_periodontal_basico.sql` | **Nuevo.** Tabla `epb` + índice.         |
| `db/init.sql`                                     | Tabla `epb` + índice `idx_epb_historia`. |
| `test/epb.domain.test.js`                         | **Nuevo.** 8 tests.                      |

### Frontend

| Archivo                                  | Cambio                         |
| ---------------------------------------- | ------------------------------ |
| `src/services/fetchClinico.js`           | `fetchEpb`, `saveEpb`.         |
| `src/hooks/useClinico.js`                | `useEpb`, `useSaveEpb`.        |
| `src/pages/hc/ExamenFisico/EpbPanel.jsx` | **Nuevo.** Panel por sextante. |
| `src/pages/hc/ExamenFisico/odonto.jsx`   | Monta `<EpbPanel>`.            |

## Consecuencias

### Positivas

- EPB/PSR disponible; cubre periodoncia del flujo MINSA.
- Aislado; no afecta otros módulos.
- `codigo_max` persistido → base para reportes RF-12.

### Negativas / Riesgos

- `valores` JSON no consultable por sextante en SQL (no requerido hoy).

## Verificación

- Backend: `npm test` → 1429 passing (8 nuevos), 0 fallos.
- Frontend: `vite build` OK; ESLint sin errores.

## Reversión

1. Revertir archivos del módulo y de UI.
2. `DROP TABLE epb;`

## Referencias

- PSR / códigos OMS de sondaje periodontal
- ADR-0012 — Módulo IHO-S
- PLAN_ODONTOGRAMA_NTS150.md (Bloque 5)
