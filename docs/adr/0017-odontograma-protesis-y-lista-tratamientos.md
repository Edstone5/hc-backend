# ADR-0017 — Prótesis interactivas robustas y lista de "Tratamientos aplicados"

**Fecha:** 2026-05-31
**Estado:** Aceptado
**Rama:** `feature/odontograma-nts150` (hc-frontend)

---

## Contexto

En la sección **Prótesis** del panel, solo **PDC** funcionaba con fiabilidad. **PPF**
(prótesis fija) y **PPR** (parcial removible) son modos _interactivos_ (el usuario
hace clic en dos dientes pilares). Fallaban porque:

1. Su detección de clic usaba `findToothGroupFromEvent`, que exige acertar el **trazo**
   del diente; como el relleno es transparente, casi siempre el clic caía en el fondo
   del SVG y se ignoraba ("Clic ignorado").
2. El panel **descartaba** el handle devuelto por el hook, por lo que no había banner
   "modo activo" ni botón "Detener", y no se podía rastrear su finalización.

Además, el equipo solicitó un mecanismo para **trazar y corregir** lo que el médico va
aplicando: una lista de tratamientos con borrado individual (errores de selección).

---

## Decisión

### 1. Modos interactivos robustos (hook `odotools.js`)

- Nuevo helper `nearestToothGroup(svg, clientX, clientY, maxDist=120)` y
  `toothGroupFromEventRobust(svg, e)`: combinan el clic directo con el diente más
  cercano (igual criterio que la selección del odontograma). Se usa en `addPPF`,
  `addDentalProsthesis` (PPR) y `addTransposition`.
- Se añadió un callback `onEnd(drew)` a `startFixedOrthoMode`,
  `startRemovableOrthoMode`, `addPPF`, `addDentalProsthesis` y `addTransposition`
  (diastema ya tenía `onDone`). Se invoca en `cleanup()` (éxito, ESC o "Detener"),
  indicando si se dibujó algo. Esto permite al panel finalizar el rastreo del modo.
- Las líneas de PPR ahora llevan `class="annotation"` y `data-id` (antes no), para
  poder borrarlas selectivamente.

### 2. Lista "Tratamientos aplicados" (panel `odotools.jsx`)

- Estado `treatments` con registros `{ id, label, tooth, color, ts }`.
- **Captura por diff del overlay:** antes de aplicar una herramienta se toma una
  instantánea de los hijos del overlay; tras aplicarla (o al finalizar un modo
  interactivo vía `onEnd`), los elementos nuevos se etiquetan con `data-rec=<id>` y se
  crea el registro. Funciona tanto para herramientas síncronas como interactivas sin
  reescribir cada hook.
- **Borrado individual:** `removeTreatment(rec)` elimina del SVG los elementos
  `[data-rec=<id>]` y, si el registro tiene diente, limpia su input; luego quita el
  registro de la lista. Permite corregir un error de selección sin borrar todo.
- La lista se sincroniza con las utilidades existentes: "Borrar todo" vacía la lista;
  "Borrar diente" elimina los registros de ese diente; "Deshacer" quita el último.

---

## Alternativas consideradas

- **Reescribir cada hook para que notifique su dibujo:** descartado; el diff del
  overlay + `data-rec` es genérico y menos invasivo.
- **Usar la tabla de intervenciones de BD como lista:** descartado. Esa tabla
  (`OdontogramaRegistros.jsx`, `odontograma_entrada`) es el **registro clínico formal**
  (diagnóstico/tratamiento/fecha/alumno). La lista nueva es un **rastreador visual de
  sesión** de lo dibujado en el editor SVG; son complementarios y se documentan como
  distintos en el README.

---

## Consecuencias

- PPF y PPR ahora se aplican con la misma tolerancia de clic que el resto del editor y
  muestran banner "modo activo" + "Detener".
- El médico puede revisar y deshacer tratamientos individuales antes de guardar.
- **Limitación conocida (v1):** la lista es de sesión (estado React del panel); no se
  rehidrata desde el SVG al recargar. Si dos tratamientos escriben en el mismo diente,
  borrar uno limpia el texto del input del diente (compartido). Trabajo futuro:
  rehidratar desde `[data-rec]`/`data-id` del SVG guardado.

---

## Verificación

- `npx vite build` → OK; `npx eslint src` → 0 errores.
- Prueba manual: PPF/PPR dibujan al conectar dos dientes; la lista registra cada
  tratamiento y el borrado individual remueve su trazo del SVG.
