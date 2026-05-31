# ADR-0016 — Auditoría lógico-visual y rediseño del panel de tratamientos del Odontograma

**Fecha:** 2026-05-31  
**Estado:** Aceptado  
**Rama:** `feature/odontograma-nts150` (hc-frontend)  
**Commit:** (pendiente — ver commit asociado)

---

## Contexto

Tras la corrección del bug de coordenadas (ADR-0015 / commit `9ce4a1c`) que desplazaba
las anotaciones SVG, el equipo realizó una auditoría completa del panel de herramientas
`odotools.jsx` para identificar:

1. Bugs lógicos que permanecían ocultos o que se manifestaban sólo en ciertos flujos.
2. Problemas de usabilidad en entorno tablet (NTS N° 188-MINSA/DGIESP-2022).
3. Deficiencias visuales: asimetría, inconsistencia de tamaños, ausencia de agrupación clínica.

---

## Bugs identificados y corregidos

### Bug #1 — `useState` mal destructurado para `coronaTempMenuOpen`

**Código anterior:**

```js
const [setCoronaTempMenuOpen] = useState(false);
```

Toma el primer elemento del array `[false, setter]` → `setCoronaTempMenuOpen = false`.
Cualquier llamada a `setCoronaTempMenuOpen(false)` lanzaba `TypeError: false is not a function`
en `onCoronaButton`, silenciado por React pero visible en consola.

**Corrección:**

```js
const [, setCoronaTempMenuOpen] = useState(false);
```

### Bug #2 — `foreignObjectBBoxInSvg` mezclaba espacios de coordenadas

Tras el commit `9ce4a1c`, `getToothBBox` devuelve coordenadas en espacio **viewBox** (0–1400).
Sin embargo, `foreignObjectBBoxInSvg` usaba `fo.getCTM()` como ruta primaria, que devuelve
coordenadas **CSS-pixel** (0–320). La función `setInputForTooth` comparaba ambos espacios
(intersección/distancia), produciendo selección errónea del foreignObject en algunos dientes.

**Corrección:** eliminada la ruta primaria; siempre se usa:

```js
const rect = fo.getBoundingClientRect();
const inv = svg.getScreenCTM().inverse();
// → coordenadas viewBox ✓
```

### Bug #3 — `onClear` usaba `window.prompt` + `window.confirm`

Inaceptable en entorno tablet (requiere teclado virtual; API no apta para pantalla táctil).
Además, `window.confirm` no es personalizable y puede ser bloqueado por el navegador.

**Corrección:** reemplazado por `clearModalOpen` (state React) que muestra un modal inline
con tres acciones: _Borrar diente seleccionado_, _Borrar todo el odontograma_, _Cancelar_.

---

## Mejoras visuales aplicadas

| Aspecto anterior                                       | Aspecto nuevo                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Botones en lista plana, tamaños inconsistentes         | Grid 2 columnas, todos `w-full`, alto uniforme                               |
| Sin agrupación clínica                                 | 6 secciones con cabecera tipográfica                                         |
| Colores Tailwind mezclados (`teal-500/600/700`)        | Paleta unificada `#0d9488` (teal-600)                                        |
| Submenús con estilos ad-hoc por componente             | Objeto `S.drop` compartido: fondo blanco, `border-radius:8`, sombra estándar |
| Modo activo: texto plano                               | Banner amarillo `#fef9c3` con botón "Detener"                                |
| Utilidades en `flex-col` al pie                        | Grid 2×2 con colores semánticos (gris/rojo/azul claro/azul oscuro)           |
| Typos: "Piesa dentaria", "PATOLÓGIA", puntos faltantes | Corregidos en todas las etiquetas                                            |

### Agrupación clínica (NTS N° 188-MINSA/2022)

| Sección                    | Herramientas                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1 · Ortodoncia             | 1 Aparat. fijo, 2 Aparat. removible                                                                         |
| 2 · Coronas                | 3 Corona (CM/CF/CMC/CV/CLM ×azul/rojo), 4 Corona temporal                                                   |
| 3 · Estado dental          | 5 Defectos esmalte, 6 Edéntulo, 8 FFP, 12 Implantación, 13 Impactación, 16 Movilidad, 17 PDA, 20 Pulpotomía |
| 4 · Anomalías morfológicas | 9 Fusión, 10 Germinación, 14 Macrodoncia, 15 Microdoncia, 18 Pieza en clavija                               |
| 5 · Posición dental        | 7 Diastema, 11 Giroversión, 19 Pieza ectópica, 21 Transposición                                             |
| 6 · Prótesis               | 22 PPF, 23 PDC, 24 PPR                                                                                      |

---

## Alternativas consideradas

- **Mantener la lista plana con scroll:** descartado porque el clínico debe reconocer
  visualmente la categoría (ortodoncia / prótesis / anomalía) sin leer los 24 números.
- **Usar ventana modal para cada submenú:** descartado — agrega una capa de interacción
  innecesaria; los desplegables inline son suficientes y evitan perder el contexto.
- **Extraer cada sección en un sub-componente:** aplazado — el panel es un único responsable
  de UX; la extracción procede si supera las 600 líneas de JSX puro.

---

## Consecuencias

- El panel es ahora auto-descriptivo: el clínico encuentra el tratamiento por categoría,
  no por número de lista.
- Todos los handlers permanecen sin cambios funcionales (sólo se reorganizó el JSX).
- `window.prompt` eliminado de todos los flujos del panel (queda como fallback de `askTooth`
  cuando no hay diente seleccionado por click, comportamiento aceptado por el equipo).
- La consistencia entre espacios de coordenadas (viewBox) es ahora completa en el pipeline
  selección → dibujado → input-text.

---

## Verificación

- `npx vite build` → OK (0 errores, solo warning de chunk size preexistente).
- `npx eslint src --ext .js,.jsx` → 0 errores.
- Prueba manual (browser): cada sección despliega correctamente; modal de borrado funciona
  sin window.prompt/confirm; anotaciones caen en el diente correcto (bug corregido en ADR-0015).
