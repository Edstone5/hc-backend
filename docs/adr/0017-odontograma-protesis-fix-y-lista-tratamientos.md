# ADR-0017 — Fix de la sección Prótesis y panel "Tratamientos aplicados"

**Fecha:** 2026-05-31
**Estado:** Aceptado
**Rama:** `feature/odontograma-nts150` (hc-frontend)

---

## Contexto

Durante la prueba en vivo posterior al ADR-0016, el odontólogo reportó dos cosas:

1. **La sección Prótesis no funciona**, salvo PDC (Prótesis Dental Completa).
2. Solicita **un panel que liste los tratamientos que va aplicando**, con la
   posibilidad de **eliminar cada uno de forma independiente** para corregir
   errores humanos de selección sin tener que borrar todo el odontograma.

---

## Problema 1 — PPF y PPR no dibujaban

### Diagnóstico

`addPPF` (Prótesis Parcial Fija), `addDentalProsthesis` (PPR) y
`addTransposition` son **modos interactivos**: devuelven un handle `{ stop }`
y capturan dos clics sobre dientes. Dos defectos:

- **El handle se descartaba** en los handlers del panel (no se guardaba en
  `activeTool`), por lo que no aparecía el banner "Detener" ni había forma de
  cancelar el modo.
- La detección del diente usaba `findToothGroupFromEvent(e.target)`, que sólo
  reconoce el diente si el clic cae **exactamente sobre el trazo** del SVG. Como
  el relleno de los dientes es transparente (`.part { fill: none }`), la mayoría
  de los clics caen en el fondo del SVG → `null` → "Clic ignorado". El usuario
  clicaba y no pasaba nada.

PDC funcionaba porque **no requiere clic**: dibuja entre molares terminales fijos
(1.8–2.8, etc.) de forma síncrona.

### Corrección (hook `odotools.js`)

- Nuevo helper `nearestToothGroup(svg, clientX, clientY, maxDist=120)`: devuelve
  el `.tooth-group` cuyo centro (en coordenadas de pantalla) está más cerca del
  clic. Mismo criterio que la selección por clic del odontograma (ADR-0014).
- Nuevo helper `toothGroupFromEventRobust(svg, e)`: combina el clic directo con
  el diente más cercano.
- `addPPF`, `addDentalProsthesis` y `addTransposition` usan ahora el clic robusto.
- Se añadió un callback `onEnd(drew)` a `startFixedOrthoMode`,
  `startRemovableOrthoMode`, `addPPF`, `addDentalProsthesis` y `addTransposition`
  (diastema ya tenía `onDone`). Se invoca en `cleanup()` con un booleano que indica
  si se llegó a dibujar (vs. cancelación por ESC/Detener). Habilita el rastreo
  (Problema 2) y garantiza que el banner "Detener" se limpie al completar.
- A las líneas de PPR (que no tenían) y a las de ortodoncia se les añadió
  `class="annotation"` + `data-id` para consistencia con el resto de anotaciones.

En el panel, PPF/PPR/Transposición/Ortodoncia/Diastema se inician vía
`startInteractive(...)`, que **sí** guarda el handle en `activeTool` (banner +
botón Detener visibles).

---

## Problema 2 — Panel "Tratamientos aplicados" con borrado individual

### Decisión de diseño

Se añade una **lista de sesión** en el panel de herramientas, separada del
**Registro de intervenciones** (tabla BD `odontograma_entrada`, con
diagnóstico/tratamiento/fecha/alumno). Justificación:

- La lista nueva traza **lo dibujado en el editor SVG** (anotaciones visuales),
  para corregir errores de selección rápidamente. Es ligera y efímera.
- El Registro de intervenciones es el **documento clínico formal** (NTS-188 /
  RF-06) y se mantiene intacto. Mezclarlos rompería la semántica de cada uno.

### Mecanismo de rastreo (sin reescribir cada herramienta)

Registro por **diferencia del overlay SVG**:

1. Antes de aplicar una herramienta se fotografían los hijos de
   `#odontograma-overlay` (`snapshotOverlay`).
2. Tras aplicarla, los hijos nuevos se etiquetan con `data-rec=<id>` y se crea un
   registro `{ id, label, tooth, color, ts }` (`pushRecord`).
3. Para herramientas **síncronas** se hace en el momento (`track(...)`).
4. Para **modos interactivos** se hace en el callback `onEnd(drew)`
   (`startInteractive(...)`), tras eliminar los marcadores temporales, de modo que
   sólo se etiqueta el trazo definitivo. Si `drew === false` (cancelado) no se
   registra nada.

### Borrado individual

`removeTreatment(rec)`:

- Elimina del SVG los elementos `[data-rec=rec.id]`.
- Si el registro tiene diente asociado, limpia el input de ese diente
  (`clearInputForTooth`).
- Quita el registro de la lista.

Además se sincroniza con las utilidades existentes: "Borrar todo" vacía la lista;
"Borrar diente X" quita los registros de ese diente; "Deshacer" quita el último
registro (mejor esfuerzo).

---

## Alternativas consideradas

- **MutationObserver permanente sobre el overlay:** más genérico, pero introduce
  complejidad de timing (callbacks asíncronos) y riesgo de fugas si no se
  desconecta. La diferencia de snapshots cubre los casos reales con código más
  simple y determinista.
- **Persistir la lista en BD / localStorage:** descartado para v1. El SVG completo
  ya se persiste con "Guardar cambios" (`odontograma_svg`); la lista es una ayuda
  de edición en sesión. Rehidratarla desde el SVG guardado queda como trabajo
  futuro (las etiquetas `data-rec` no sobreviven a serializar/recargar).
- **Convertir PPF/PPR a selección por dos dientes (sin clic en SVG):** descartado;
  el clic interactivo es el patrón ya conocido por el usuario y, con el clic
  robusto, es fiable.

---

## Consecuencias

- La sección Prótesis (PPF, PDC, PPR) funciona de forma fiable en tablet.
- El odontólogo puede revisar y revertir tratamientos individualmente.
- **Limitación conocida:** si dos tratamientos escriben en el input del mismo
  diente, borrar uno limpia el texto de ambos (el borrado de input es por diente,
  no por registro). Aceptable para v1; documentado.
- La lista no se rehidrata tras recargar (trabajo futuro).

---

## Verificación

- `npx vite build` → OK.
- `npx eslint src/hooks/odotools.js src/pages/hc/ExamenFisico/odotools.jsx` → 0 errores.
- Prueba manual (browser): PPF y PPR dibujan al clicar cerca de los dientes pilares;
  cada tratamiento aparece en la lista y se elimina individualmente (trazo + texto).
