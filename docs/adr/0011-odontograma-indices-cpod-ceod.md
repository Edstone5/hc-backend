# ADR-0011 — Índices CPO-D / CEO-D derivados del odontograma (RF-12)

**Estado:** Aceptado ✅
**Fecha:** 2026-05-30
**Decididores:** Equipo Grupo 4
**Requisito cubierto:** RF-12 (informes clínico-epidemiológicos) + flujo MINSA
**Norma aplicable:** Indicadores epidemiológicos OMS/MINSA (CPO-D, CEO-D)

---

## Contexto

El flujo de atención estándar del MINSA y la clínica UNJBG (que atiende
odontopediatría) usan los índices de experiencia de caries:

- **CPO-D** (dentición permanente): Cariados + Perdidos + Obturados.
- **CEO-D** (dentición decidua): cariados + extraídos + obturados.

Tras el Bloque 2 (catálogo de hallazgos estructurado), ya es posible derivar
estos índices automáticamente desde las entradas del odontograma.

## Decisión

1. **Cálculo derivado en el frontend, sin tabla nueva.** El índice se computa
   desde las entradas (`useOdontograma`) ya cargadas en la vista. No requiere
   endpoint ni persistencia: es una proyección de datos existentes.

2. **Mapeo hallazgo → clase** (`indicesOdonto.js`):
   `C → cariado`, `DEX → perdido`, `O|R|Io → obturado`. Coincide con
   `CLASE_CPOD` del dominio backend (`hallazgosCatalogo.js`).

3. **Anti-doble-conteo:** cada diente se cuenta una sola vez, con prioridad
   Cariado > Perdido > Obturado (criterio simplificado para uso académico).

4. **Separación permanente/decidua por rango FDI:** 11-48 permanentes (CPO-D),
   51-85 deciduos (CEO-D).

5. **UI:** panel "Índices de experiencia de caries" dentro de la vista
   Odontograma (coherente con la decisión de ubicar los módulos nuevos ahí),
   con tarjetas C/P/O y total para cada índice.

## Opciones consideradas

| Opción                                     | Resultado                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint de agregación en backend          | Rechazada por ahora: los datos ya están en el cliente; añade red y complejidad. Reconsiderar para RF-12 (reportes admin agregados de varios pacientes). |
| Persistir el índice calculado              | Rechazada: dato derivado; persistirlo arriesga inconsistencia con las entradas.                                                                         |
| **Cálculo derivado en frontend (elegida)** | Simple, siempre consistente con las entradas, cero DDL.                                                                                                 |

## Cambios realizados

### Frontend

| Archivo                                      | Cambio                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/pages/hc/ExamenFisico/indicesOdonto.js` | **Nuevo.** `calcularIndices(entradas)` → CPO-D y CEO-D con anti-doble-conteo. |
| `src/pages/hc/ExamenFisico/odonto.jsx`       | Panel de índices que consume `calcularIndices`.                               |
| `test/indicesOdonto.test.js`                 | **Nuevo.** 6 tests de la lógica de cálculo.                                   |

### Backend

- Sin cambios. (El mapeo `CLASE_CPOD` ya se había dejado preparado en
  `hallazgosCatalogo.js` en el Bloque 2 para un futuro endpoint agregado RF-12.)

## Consecuencias

### Positivas

- Índices epidemiológicos automáticos, base para RF-12.
- Sin DDL ni endpoints nuevos; consistencia garantizada con las entradas.

### Negativas / Riesgos

- El cálculo es por paciente (no agregado multi-paciente); el reporte admin
  agregado de RF-12 requerirá un endpoint backend en un sprint posterior.
- El criterio de prioridad (C>P>O) es una simplificación; revisar reglas OMS
  exactas si se requiere rigor epidemiológico pleno.

## Verificación

- Frontend: `vite build` OK; `vitest run test/indicesOdonto.test.js` → 6 passing.
- Nota de entorno: la suite de vitest completa requiere `jsdom` (no instalado en
  este entorno); el test de índices corre con `// @vitest-environment node`.

## Reversión

1. Eliminar el panel de índices de `odonto.jsx`.
2. Borrar `indicesOdonto.js` y su test.

## Referencias

- RF-12 — Lista de RF y RNF.pdf
- ADR-0010 — Catálogo de 39 hallazgos (provee `codigo_hallazgo` y `CLASE_CPOD`)
- PLAN_ODONTOGRAMA_NTS150.md (Bloque 3)
