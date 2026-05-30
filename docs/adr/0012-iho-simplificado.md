# ADR-0012 — Módulo IHO-S (Índice de Higiene Oral Simplificado)

**Estado:** Aceptado ✅
**Fecha:** 2026-05-30
**Decididores:** Equipo Grupo 4
**Requisito cubierto:** Flujo de atención MINSA / odontopediatría (índices de higiene)
**Norma aplicable:** Índice de Greene y Vermillion (IHO-S), uso estándar MINSA

---

## Contexto

El flujo MINSA y la clínica UNJBG (odontopediatría/periodoncia) usan el **IHO-S**
de Greene y Vermillion: sobre 6 dientes índice (1.6, 1.1, 2.6, 3.6, 3.1, 4.6) se
mide el índice de **detritos** (DB, 0-3) y de **cálculo** (DC, 0-3). El índice
total = promedio(DB) + promedio(DC), con clasificación Bueno/Regular/Malo.

El módulo de higiene existente (`higieneBocal` + tabla `examen_higiene_oral`)
solo guarda una **evaluación cualitativa** (campo `estado_higiene`:
Bueno/Regular/Deficiente). NO es el índice cuantitativo IHO-S → se requiere un
módulo nuevo.

## Decisión

1. **Módulo DDD nuevo `ihoSimplificado/`** (no se extiende `higieneBocal` para no
   alterar su contrato ni sus tests existentes).
2. **Tabla `iho_s`** (migración 004): guarda los 6 valores como JSON (`valores`)
   - los resultados calculados (`idb`, `icalc`, `ihos`, `clasificacion`). Se
     guarda el resultado computado para reportes (RF-12) y trazabilidad.
3. **Cálculo y validación en el dominio** (`IhoSimplificadoAggregate`): valida
   diente índice ∈ {16,11,26,36,31,46} y DB/DC ∈ [0,3]; computa promedios y
   clasifica. El controller responde el `resumen`.
4. **UI:** componente separado `IhoSPanel.jsx` (no se infla más `odonto.jsx`,
   crítica de mantenibilidad ya señalada en ADR-0008/0009). Tabla 2×6 (DB/DC) con
   cálculo en vivo + guardado. Ubicado dentro de la vista Odontograma.

## Opciones consideradas

| Opción                                                   | Resultado                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Extender `higieneBocal` (añadir columnas)                | Rechazada: mezcla evaluación cualitativa con índice cuantitativo; arriesga tests existentes. |
| Tabla normalizada `iho_s` + `iho_s_diente`               | Rechazada: 6 dientes fijos; el JSON + columnas calculadas es suficiente y más simple.        |
| **Módulo nuevo + `iho_s` (JSON + computados) (elegida)** | Aislado, calculable, reportable, sin tocar lo existente.                                     |

## Cambios realizados

### Backend

| Archivo                                                       | Cambio                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `ihoSimplificado/domain/ihoSimplificadoDomain.js`             | **Nuevo.** `IhoSimplificadoAggregate`, `clasificarIhos`, `DIENTES_INDICE`. |
| `ihoSimplificado/infrastructure/ihoSimplificadoRepository.js` | **Nuevo.** consultar/guardar; parsea `valores` JSON.                       |
| `ihoSimplificado/application/ihoSimplificadoController.js`    | **Nuevo.** GET/POST.                                                       |
| `routes/hcRoutes.js`                                          | Rutas `GET/POST /:id/iho-s`.                                               |
| `db/migrations/004_iho_simplificado.sql`                      | **Nuevo.** Tabla `iho_s` + índice. Dual MySQL/PostgreSQL.                  |
| `db/init.sql`                                                 | Tabla `iho_s` + índice `idx_ihos_historia`.                                |
| `test/ihoSimplificado.domain.test.js`                         | **Nuevo.** 10 tests (cálculo, clasificación, validación).                  |

### Frontend

| Archivo                                   | Cambio                                |
| ----------------------------------------- | ------------------------------------- |
| `src/services/fetchClinico.js`            | `fetchIhoS`, `saveIhoS`.              |
| `src/hooks/useClinico.js`                 | `useIhoS`, `useSaveIhoS`.             |
| `src/pages/hc/ExamenFisico/IhoSPanel.jsx` | **Nuevo.** Panel con cálculo en vivo. |
| `src/pages/hc/ExamenFisico/odonto.jsx`    | Monta `<IhoSPanel>`.                  |

## Consecuencias

### Positivas

- IHO-S cuantitativo disponible; cubre odontopediatría/periodoncia del flujo MINSA.
- Aislado: no afecta `higieneBocal` ni sus tests.
- Resultado persistido → base para reportes RF-12.

### Negativas / Riesgos

- Duplicación leve de la lógica de clasificación (dominio backend + panel
  frontend para cálculo en vivo). Mantener ambas sincronizadas.
- `valores` como JSON TEXT no es consultable por diente en SQL (no requerido hoy).

## Verificación

- Backend: `npm test` → 1421 passing (10 nuevos), 0 fallos.
- Frontend: `vite build` OK; ESLint sin errores.

## Reversión

1. Revertir archivos del módulo y de UI.
2. `DROP TABLE iho_s;`

## Referencias

- Índice IHO-S de Greene y Vermillion (flujo MINSA)
- ADR-0011 — Índices CPO-D/CEO-D
- PLAN_ODONTOGRAMA_NTS150.md (Bloque 4)
