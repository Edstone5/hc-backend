# ADR-0032 — Menú lateral desplazable (zoom) y fusión en la línea media

- **Estado:** Aceptado
- **Fecha:** 2026-06-01
- **Rama:** `feature/odontograma-nts150` (hc-frontend)
- **Ámbito:** `hc-frontend` (`components/layout/Sidebar.jsx`, `hooks/odotools.js`)
- **Relacionado:** ADR-0029 (fusión por vecino contiguo)

## Contexto

Dos defectos detectados en pruebas manuales:

1. **Menú lateral cortado al hacer zoom (alumno).** El `<aside>` del `Sidebar`
   tenía `overflow-hidden` y el `<nav>` (14 ítems) no era desplazable. Al aumentar
   el zoom del navegador, la altura visible disminuye y los últimos ítems quedaban
   recortados sin posibilidad de scroll.

2. **La fusión fallaba con la pieza 3.1.** El cálculo de vecinos usaba `num±0.1`
   dentro del mismo cuadrante, lo que es incorrecto en los **incisivos centrales
   (x.1)**: en notación FDI la posición aumenta alejándose de la línea media, por lo
   que el vecino **mesial** de un central cruza la línea media hacia el central del
   cuadrante hermano (3.1↔4.1, 1.1↔2.1, 5.1↔6.1, 7.1↔8.1). `num-0.1` producía "x.0"
   (inexistente), de modo que 3.1 no ofrecía su vecino real 4.1.

## Decisión

1. **Sidebar:** el `<nav>` pasa a `flex-1 min-h-0 overflow-y-auto` y el `<aside>`
   añade `min-h-0`, de modo que la lista de navegación se desplaza dentro del panel
   cuando no cabe (con o sin zoom), sin recortarse.

2. **Adyacencia FDI correcta:** nueva función `fdiNeighbors(name)` que calcula el
   vecino **mesial** y **distal** anatómicos:
   - posición `p` 1..8 (deciduos 1..5); cuadrante `q`.
   - mesial: si `p<=1` → central del cuadrante hermano (`partner(q).1`); si no
     `q.(p-1)`.
   - distal: `q.(p+1)` salvo en el último diente del cuadrante (8 permanentes / 5
     deciduos).
     `getFusionCandidates` usa estos vecinos (se elimina la restricción de "mismo
     cuadrante", que impedía la fusión de centrales en la línea media).

## Consecuencias

- El menú lateral es usable a cualquier nivel de zoom.
- La fusión de 3.1 (y de todos los centrales) ofrece correctamente el vecino de la
  línea media; con dos vecinos válidos aparece el modal de elección (ADR-0029).

## Verificación (Norma de Oro)

- `npx eslint src` → 0 errores · `npx vite build` → OK · `npm run test:run` → 136.
- Manual: zoom como alumno → el menú scrollea; fusión en 3.1 → ofrece 4.1 y 3.2.
