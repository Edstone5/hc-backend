# ADR-0033 — Matriz de exclusiones del odontograma (NTS N° 188-MINSA) y desfase visual de anotaciones

- **Estado:** Aceptado
- **Fecha:** 2026-06-01
- **Rama:** `feature/odontograma-nts150` (hc-frontend)
- **Ámbito:** `hc-frontend` (`pages/hc/ExamenFisico/odotools.jsx`, `hooks/odotools.js`)
- **Relacionado:** ADR-0021/0022 (exclusión pieza ausente), ADR-0024/0029 (doble formación)

## Contexto

El usuario pidió verificar que las exclusiones clínicas estén implementadas
correctamente en **todos** los tratamientos y reportó que algunos hallazgos **se
superponen visualmente** en la misma pieza. Al tratarse de salud, se solicitó
fundamentar las reglas en la norma vigente.

## Fuente normativa

**NTS N° 188-MINSA/DGIESP-2022 — Norma Técnica de Salud para el Uso del
Odontograma** (Dirección de Salud Bucal, MINSA Perú, ago. 2022). Puntos usados:

- Solo se usan los colores **azul** (buen estado / no patológico) y **rojo** (mal
  estado, temporal o patológico).
- **Pieza ausente**: se marca un **aspa** sobre la pieza con las siglas **DNE**
  (no erupcionado), **DEX** (ausente por extracción asociada a caries) o **DAO**
  (ausente por otra causa). El aspa cubre la pieza completa.
- **Fusión**: unión de dos piezas/gérmenes en una sola estructura.
- **Geminación**: de un solo germen se forman (o intentan formarse) dos piezas.
- **Giroversión**: rotación de la pieza sobre su eje longitudinal.
- **Corona**: reemplazo artificial de la corona clínica. **Implante**: dispositivo
  que sustituye una o más piezas.

Fuentes:

- NTS N° 188-MINSA/DGIESP-2022 (gob.pe / MINSA).
- Norma Técnica del Odontograma — Colegio Odontológico del Perú (mirror).

## Decisión

### Auditoría: matriz **conservadora** (solo lo clínicamente imposible)

La mayoría de hallazgos pueden coexistir en una pieza (p.ej. caries + movilidad +
giroversión). Se bloquean únicamente los conjuntos mutuamente excluyentes, todos
fundamentados en la norma:

| Grupo (exclusión mutua)       | Miembros                                        | Sustento NTS-188                                              |
| ----------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| **Ausencia** (excluye TODO)   | DNE / DEX / DAO                                 | aspa sobre toda la pieza → no hay corona para otros hallazgos |
| **Doble formación**           | Fusión (F) ↔ Germinación (G)                   | una pieza es unión de dos, o división de uno; no ambas        |
| **Giroversión**               | derecha ↔ izquierda                            | rota en un solo sentido                                       |
| **Corona protésica unitaria** | una sola corona por pieza (Co/Cv/Cmc/Clm/Cf/Ct) | reemplazo único de la corona clínica                          |
| **Tamaño/forma de la corona** | Macrodoncia ↔ Microdoncia ↔ Pieza en clavija  | descriptores excluyentes del tamaño/forma del mismo diente    |

Cambio de esta entrega: se **añade Pieza en clavija** al grupo de tamaño/forma
(`grupoDe` en `odotools.jsx`, grupo `tamaño/forma`). El resto de grupos ya existía
(ADR-0021/0024/0029). No se añaden exclusiones discutibles (p.ej. implante vs
caries) para no bloquear casos válidos: la opción adoptada fue la conservadora.

### Desfase visual de anotaciones que SÍ pueden coexistir

Helper `drawCenteredToothLabel(svg, diente, texto, color, clase, prefijo)` en
`hooks/odotools.js`: las etiquetas centradas (FFP, IMP) se marcan con clase
`tooth-label` + `data-tooth`; al dibujar una nueva, se cuenta cuántas ya hay en esa
pieza y se desplaza verticalmente (escalón ≈ tamaño de fuente) para que no se tapen.
`addFosasFisurasProfundas` y `addImplant` se refactorizan para usarlo. Las figuras
con posición clínicamente significativa (germinación, fusión, giroversión, aspa de
ausencia) **no** se desplazan (su ubicación es información).

## Consecuencias

- Las combinaciones clínicamente imposibles se bloquean con aviso (toast); las
  válidas se permiten, ahora sin solaparse ilegiblemente.
- La matriz queda documentada y trazable a la NTS-188; ampliarla (criterio clínico)
  es un cambio acotado en `grupoDe`.

## Verificación (Norma de Oro)

- `npx eslint src` → 0 errores · `npx vite build` → OK · `npm run test:run` → 136.
- Manual: MIC y luego clavija (o macrodoncia) en una misma pieza → bloqueado;
  FFP + IMP en una pieza → ambas etiquetas legibles (desfasadas).
