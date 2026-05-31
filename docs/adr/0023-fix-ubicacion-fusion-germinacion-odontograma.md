# ADR-0023 — Fix de ubicación en Fusión y Germinación (Anomalías morfológicas del odontograma)

- **Estado:** Aceptado
- **Fecha:** 2026-05-31
- **Rama:** `feature/odontograma-nts150` (frontend)
- **Ámbito:** `hc-frontend` (solo cliente; el backend no cambia)
- **Relacionado:** ADR-0015 (fix coordenadas viewBox del overlay), ADR-0016 (rediseño del panel en 6 secciones), ADR-0018 (fix 7.3→3.8, mapeo determinista diente→input)

## Contexto

En la sección **"4 · Anomalías morfológicas"** del panel del odontograma
(`hc-frontend/src/pages/hc/ExamenFisico/odotools.jsx`), las herramientas
**Fusión** y **Germinación** dibujaban su anotación (círculo / elipse) sobre el
**diente equivocado**: el síntoma era análogo al bug 7.3→3.8 corregido en
ADR-0018, pero con distinta causa raíz.

Ambas funciones del hook (`hc-frontend/src/hooks/odotools.js`,
`addGerminacion` y `addFusion`) calculaban la posición del centro del diente
con `element.getCTM()`:

```js
const ctm = el.getCTM ? el.getCTM() : null;
return pt.matrixTransform(ctm); // addGerminacion (toSvgPoint)
// ...
const global = pt.matrixTransform(textEl.getCTM()); // addFusion
```

`getCTM()` devuelve coordenadas en **píxeles CSS** (el SVG se renderiza a
~320×320 px), mientras que el `#odontograma-overlay` dibuja en **unidades
viewBox** (0..1400). El factor de error es ≈ 4.375 (= 1400/320), por lo que la
anotación quedaba escalada a ~1/4.375 y aparecía desplazada hacia la esquina
superior-izquierda, "encima de otro diente". Es exactamente el problema de
espacio de coordenadas que ya se había resuelto para `addCrown` en ADR-0015 con
el helper `getElementToSvgMatrix` (compone `el.getScreenCTM()` con el inverso de
`svg.getScreenCTM()` → unidades viewBox correctas).

`addGerminacion` además inferia el radio con una heurística sobre `getCTM()`
(`scaleApprox`), lo que producía radios diminutos e inconsistentes.

## Decisión

Migrar `addGerminacion` y `addFusion` a los **helpers probados** que ya usa
`addGiroversion`: `centerOfTooth(svg, diente)` / `getToothBBox(svg, diente)`,
que devuelven el centro y el bbox del diente **en unidades viewBox** (vía
`getElementToSvgMatrix`). El overlay comparte ese espacio, por lo que el círculo
/ la elipse se dibujan directamente con `center.x` / `center.y` sin más
transformaciones.

- **Germinación:** centro = `centerOfTooth(svg, name)`; radio proporcional al
  tamaño real del diente en viewBox: `r = clamp(8, 45, round(minSide * 0.35))`.
  Se elimina la heurística `scaleApprox`/`getCTM`, el doble lookup
  `text.tooth-name` + `g.tooth-group` y los offsets mágicos.
- **Fusión:** centro de cada uno de los dos dientes a marcar = `centerOfTooth`.
  La elipse conserva su tamaño fijo (`rx=40`, `ry=15`, unidades viewBox). Se
  eliminan las variables locales `textEl`/`toothGroup` que quedaban sin uso.

`centerOfTooth` localiza el diente con `getToothGroup` →
`[data-name="<diente>"]`, el mismo criterio determinista que `inputForToothDOM`
(ADR-0018), por lo que el diente resuelto es consistente con el resto del
sistema, incluidos los deciduos (cuadrantes 5-8).

## Alcance — revisión de TODA la sección 4

Se revisaron las cinco herramientas de "Anomalías morfológicas":

| #   | Herramienta           | Mecanismo                           | Estado                                     |
| --- | --------------------- | ----------------------------------- | ------------------------------------------ |
| 9   | Fusión                | dibuja elipses en overlay           | **corregido** (usaba `getCTM`)             |
| 10  | Germinación           | dibuja círculo en overlay           | **corregido** (usaba `getCTM`)             |
| 14  | Macrodoncia (MAC)     | `setInputForTooth` (texto en input) | OK — no posiciona en overlay               |
| 15  | Microdoncia (MIC)     | `setInputForTooth` (texto en input) | OK — no posiciona en overlay               |
| 18  | Pieza en clavija (PC) | `addPegTooth`                       | OK — ya usa helpers viewBox (sin `getCTM`) |

Tras el cambio, `getCTM` solo permanece en el hook como helper legítimo
(`getElementToSvgMatrix`, `computePointsFromParts`) y en comentarios; no queda
ningún cálculo de posición de anotación basado en `getCTM`.

## Consecuencias

- **Positivas:** Fusión y Germinación caen sobre el diente correcto (permanentes
  y deciduos); el código reutiliza un único camino de coordenadas probado, más
  simple y mantenible; radio de germinación coherente con el tamaño del diente.
- **Neutras:** sin cambios de API ni de backend; la lista "Tratamientos
  aplicados" (captura por diff del overlay) sigue funcionando igual.
- **Pendiente de prueba manual:** verificación visual end-to-end en navegador
  (no hay tests UI por falta de `jsdom`, ver pendientes del checkpoint).

## Verificación (Norma de Oro)

- `npx vite build` → `✓ built in 3.23s` (OK).
- `npx eslint src` → sin errores ni warnings.
- Backend sin cambios (no se ejecuta `npm test`; la suite sigue en 1452 passing).
