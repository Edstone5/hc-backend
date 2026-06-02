# ADR-0029 — Exclusión doble formación (F/G) en el panel + fusión por vecino contiguo (modal tablet)

- **Estado:** Aceptado
- **Fecha:** 2026-06-01
- **Rama:** `feature/odontograma-nts150` (hc-frontend)
- **Ámbito:** `hc-frontend` (panel del odontograma y hook de dibujo)
- **Relacionado:** ADR-0023 (fix ubicación Fusión/Germinación), ADR-0024
  (exclusión mutua F vs G en el dominio backend + intención de espejo cliente)

## Contexto

Durante las pruebas manuales del editor SVG se detectaron dos defectos en la
sección «4. Anomalías morfológicas»:

1. **La exclusión doble formación no operaba en el panel.** Aplicar germinación
   sobre un diente que ya formaba parte de una fusión NO se bloqueaba. El espejo
   cliente que ADR-0024 dio por hecho nunca llegó a la función `grupoDe` del panel
   (`odotools.jsx`): no clasificaba ni `Fusión` ni `Germinación`, así que
   `validarExclusion` devolvía siempre `ok`. Además, la fusión abarca DOS dientes
   (la pieza y su vecino) pero solo se registraba uno en la lista de sesión, por lo
   que aunque la regla existiera no habría cubierto al diente vecino.

2. **La fusión elegía el vecino con `window.prompt`.** Poco usable en tablet y
   ajeno al patrón de modales del resto del panel.

Clínicamente: la **fusión** es la unión de dos gérmenes dentarios **adyacentes**
(siempre dos piezas contiguas → las únicas posibilidades son el vecino izquierdo o
el derecho del mismo cuadrante); la **germinación** es un único germen que intenta
dividirse (una sola pieza). Una pieza no puede ser ambas a la vez (doble formación).

## Decisión

### Fuente de verdad = el SVG (sobrevive a la rehidratación)

La fusión marca AMBAS piezas en el overlay con `.fusion-circle[data-tooth=…]` y la
germinación con `.germination-circle[data-tooth=…]`. Se consulta el overlay para
decidir la exclusión, en vez de depender solo de la lista de sesión `treatments`
(que se vacía al recargar/rehidratar). Helpers nuevos en `hooks/odotools.js`:

- `toothHasFusion(diente)` / `toothHasGerminacion(diente)`: ¿la pieza ya tiene ese
  círculo dibujado?
- `getFusionCandidates(diente)`: analiza los vecinos contiguos (mismo cuadrante),
  cuáles existen y cuáles están libres (`selectable`).

### Fusión: vecino contiguo explícito + modal (tablet)

`addFusion(tooth, color, forcedNeighbor)` ahora recibe el vecino de forma explícita
y **se elimina el `window.prompt`**. El panel (`odotools.jsx`):

- Si solo hay un vecino contiguo libre → fusiona directo.
- Si hay dos → abre un **modal interactivo** con las dos únicas posibilidades,
  seleccionables por **clic o teclado (Tab/Enter)** con botones grandes (apto para
  tablet). Patrón y estilo idénticos al modal de borrado existente.

### Exclusión doble formación

- `grupoDe` clasifica `Fusión`→`{doble formación, F}` y `Germinación`→
  `{doble formación, G}` (espejo de `GRUPOS_EXCLUSION_MUTUA` del backend).
- `onGerminacion`: bloquea si `toothHasFusion(diente)`.
- `onFusion` / `aplicarFusion`: bloquea si la pieza o el vecino tienen germinación.

## Alternativas consideradas

- **Confiar solo en la lista de sesión `treatments`:** descartada; no cubre el
  diente vecino de la fusión ni sobrevive a la rehidratación del SVG guardado.
- **Mantener `window.prompt`:** descartada por usabilidad en tablet.

## Consecuencias

- No se puede marcar germinación en una pieza fusionada (ni viceversa); el bloqueo
  funciona aunque el odontograma se haya recargado desde BD.
- La fusión es explícita y táctil; se refuerza que solo ocurre entre contiguos.
- La eliminación de una fusión desde «Tratamientos aplicados» sigue borrando ambos
  círculos (se etiquetan con el mismo `data-rec`).

## Verificación (Norma de Oro)

- `npx eslint src` → 0 errores.
- `npx vite build` → OK.
- `npm run test:run` → 136 passing (sin regresiones).
- Pruebas manuales: germinación sobre pieza fusionada → bloqueada con toast;
  fusión con dos vecinos → modal; fusión con un vecino → directa.
