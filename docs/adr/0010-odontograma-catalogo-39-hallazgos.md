# ADR-0010 — Catálogo de 39 hallazgos SIHCE/NTS-150 en el odontograma (RF-06 / RF-12)

**Estado:** Aceptado ✅
**Fecha:** 2026-05-30
**Decididores:** Equipo Grupo 4
**Requisito cubierto:** RF-06 (nomenclatura de hallazgos) + RF-12 (reportes por hallazgo)
**Norma aplicable:** NTS N° 150-MINSA/2022/DGIESP

---

## Contexto

El registro de intervenciones del odontograma usaba un campo `diagnostico` de
**texto libre**. La NTS N° 150 exige **nomenclatura oficial** de hallazgos, y
RF-12 requiere reportes agregados (prevalencia de caries, estado por diente),
imposibles de calcular de forma fiable sobre texto libre.

El SIHCE del MINSA define **39 hallazgos** del odontograma. Se decidió (decisión
del PM) tratarlos como **catálogo fijo**.

## Decisión

1. **Catálogo en el dominio (no tabla de BD).** Los 39 hallazgos viven en
   `odontograma/domain/hallazgosCatalogo.js` (backend) y en
   `hallazgosOdonto.js` (frontend), como copias sincronizadas. Se evita una
   tabla + seed para mantener la migración simple; el catálogo es estable.

2. **Columna `codigo_hallazgo`** (VARCHAR(10), nullable) en
   `odontograma_entrada` (migración 003). El `diagnostico` libre se conserva
   como descripción/observación complementaria → **retrocompatible** con las
   filas y entradas previas.

3. **Validación en el dominio.** `HallazgoVO` valida el código contra el
   catálogo (Set O(1)); es **opcional** (null permitido) para no romper las
   entradas históricas de texto libre.

4. **UX:** en `odonto.jsx`, un `<select>` "Hallazgo (NTS N° 150)" con los 39
   códigos. Al elegir uno, autocompleta el `diagnostico` si está vacío
   (editable). La tabla muestra una columna "Hallazgo" con el código y el
   nombre completo en tooltip.

## Opciones consideradas

| Opción                                                              | Resultado                                                                                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabla `catalogo_hallazgo_odonto` + FK + seed                        | Rechazada (por ahora): añade DDL, seed y JOINs sin beneficio en un catálogo fijo de 39 ítems. Reconsiderar si se vuelve editable por admin. |
| Reemplazar `diagnostico` por el código                              | Rechazada: rompe retrocompatibilidad y pierde la observación libre que pide RF-06.                                                          |
| **Columna nueva `codigo_hallazgo` + catálogo en dominio (elegida)** | Estructurado para RF-12, retrocompatible, mínimo DDL.                                                                                       |

## Cambios realizados

### Backend

| Archivo                                               | Cambio                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `odontograma/domain/hallazgosCatalogo.js`             | **Nuevo.** 39 hallazgos + `CODIGOS_HALLAZGO` (Set) + `CLASE_CPOD` (para Bloque 3). |
| `odontograma/domain/odontogramaDomain.js`             | `HallazgoVO`; `codigoHallazgo` en el aggregate de entrada (param 9).               |
| `odontograma/infrastructure/odontogramaRepository.js` | `codigo_hallazgo` en el INSERT.                                                    |
| `db/migrations/003_odontograma_codigo_hallazgo.sql`   | **Nuevo.** ALTER + índice. Dual MySQL/PostgreSQL.                                  |
| `db/init.sql`                                         | Columna `codigo_hallazgo` + índice `idx_odonto_hallazgo`.                          |
| `test/odontograma.domain.test.js`                     | **Nuevo.** 10 tests (TipoVO, HallazgoVO, SVG aggregate).                           |

### Frontend

| Archivo                                        | Cambio                                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/pages/hc/ExamenFisico/hallazgosOdonto.js` | **Nuevo.** Catálogo + `HALLAZGO_LABEL`.                                                               |
| `src/pages/hc/ExamenFisico/odonto.jsx`         | Selector de hallazgo con autocompletado; columna "Hallazgo" en la tabla; `codigoHallazgo` en el form. |

## Consecuencias

### Positivas

- Nomenclatura oficial NTS N° 150 cumplida.
- Base estructurada para RF-12 (reportes) y Bloque 3 (CPO-D, vía `CLASE_CPOD`).
- Retrocompatible (campo opcional; texto libre preservado).

### Negativas / Riesgos

- Catálogo duplicado backend/frontend → **mantener sincronizado** manualmente.
- La migración 003 no es idempotente para la columna (correr una vez).

## Verificación

- Backend: `npm test` → 1411 passing (10 nuevos), 0 fallos.
- Frontend: `vite build` OK; ESLint sin errores.

## Reversión

1. Revertir archivos (rama `feature/odontograma-nts150-bloque1`).
2. `ALTER TABLE odontograma_entrada DROP COLUMN codigo_hallazgo;`

## Referencias

- RF-06, RF-12 — Lista de RF y RNF.pdf
- NTS N° 150-MINSA/2022/DGIESP
- ADR-0009 — Tipo inicial/evolutivo y persistencia híbrida del SVG
- PLAN_ODONTOGRAMA_NTS150.md (Anexo A — los 39 hallazgos)
