# ADR-0008 — Consolidación del Odontograma en Examen Físico (RF-06)

**Estado:** Aceptado ✅  
**Fecha:** 2026-05-30  
**Decididores:** Equipo Grupo 2  
**Requisito cubierto:** RF-06 — Odontogramas (inicial y evolutivo)

---

## Contexto

Existían dos implementaciones distintas del odontograma accesibles de forma
independiente desde el sidebar de navegación:

| Implementación     | Ruta                                 | Componente                  | Persistencia      |
| ------------------ | ------------------------------------ | --------------------------- | ----------------- |
| SVG interactivo    | `/historia/:id/examen-fisico/odonto` | `odonto.jsx + odotools.jsx` | `localStorage`    |
| Tabla de registros | `/historia/:id/odontograma`          | `OdontogramaPage.jsx`       | **Base de datos** |

Ambas eran **complementarias** desde la perspectiva clínica y de RF-06:

- El SVG representa el **odontograma inicial** (estado visual en el momento de la consulta)
- La tabla representa el **odontograma evolutivo** (registro estructurado de
  intervenciones por diente a lo largo del tiempo)

La separación en dos items del sidebar creaba confusión para el usuario ("¿cuál
odontograma debo usar?") y dividía el flujo de trabajo del estudiante.

La decisión fue tomada en reunión del grupo el 2026-05-30 con la directiva de
"todo lo concerniente al odontograma debe ir en el apartado de Examen Físico".

---

## Decisión

### 1. Eliminar el link "Odontograma" del sidebar principal

El item `{ path: '/historia/:id/odontograma', label: 'Odontograma' }` fue
removido del array `menuItems` en `HcLayout.jsx`.

El acceso al odontograma completo ahora es:
**Examen Físico → Odontograma** (botón ya existente en `ExamenFisicoMenu.jsx`)

### 2. Preservar `OdontogramaPage.jsx` sin eliminarlo

El archivo `hc-frontend/src/pages/hc/Odontograma/OdontogramaPage.jsx` se
conserva intacto en disco. La ruta `/historia/:id/odontograma` se comentó
en `App.jsx` (no eliminada).

_Justificación: el grupo indicó "reserva la información para luego de la
evaluación". La restauración completa requiere descomentar 4 líneas en `App.jsx`
y una en `HcLayout.jsx`._

### 3. Integrar la tabla de entradas de BD dentro de `odonto.jsx`

Se añadió al final de la vista principal de `odonto.jsx` una sección
"Registro de Intervenciones" que replica la funcionalidad de `OdontogramaPage.jsx`:

- Botón "+ Nueva intervención" que despliega un formulario colapsable
- Formulario: diente (FDI), superficie, diagnóstico, tratamiento, alumno, fecha
- Tabla de todas las entradas registradas en BD para la HC actual
- Botón de eliminar por fila

Los hooks React Query (`useOdontograma`, `useAddOdontogramaEntrada`,
`useDeleteOdontogramaEntrada`) ya existían y se importaron en `odonto.jsx`.

---

## Opciones consideradas

### Opción A — Redirigir la ruta `/odontograma` a `/examen-fisico/odonto`

Mantener la URL pero hacer que navegue automáticamente al SVG.

**Rechazada porque:**

- No resuelve el problema: el sidebar sigue mostrando dos entradas
- Un `<Navigate>` silencioso puede confundir al usuario sin feedback

### Opción B (elegida) — Consolidar en `odonto.jsx`, desactivar ruta standalone

Un único punto de entrada en Examen Físico con el SVG + la tabla juntos.

**Elegida porque:**

- Un único lugar = flujo de trabajo continuo para el estudiante
- La tabla de BD queda visible junto al SVG, reforzando la complementariedad
- Sin romper el SVG existente ni las herramientas de `odotools.jsx`
- Inversión de cambio mínima: ~50 líneas añadidas al final del componente,
  todo el resto intacto

### Opción C — Crear un nuevo componente `OdontogramaCompleto.jsx`

Fusionar ambos en un componente nuevo, eliminando los dos actuales.

**Rechazada porque:**

- El SVG tiene ~1800 líneas de JSX con lógica específica de `visorOdonto.js`;
  moverlo implica riesgo de romper los event listeners del script externo
- El grupo pidió no alterar la funcionalidad existente

---

## Consecuencias

### Positivas

- Sidebar más limpio (14 → 13 items visibles para el estudiante)
- RF-06 se cumple completamente: SVG (odontograma inicial) + tabla BD (evolutivo)
  en una sola vista coherente
- El docente puede revisar ambos desde la misma pantalla al auditar el trabajo
  del estudiante

### Negativas / Riesgos

- El componente `odonto.jsx` creció de ~1800 a ~2100 líneas. Si el equipo
  requiere mantenibilidad alta, en el siguiente sprint se puede extraer la
  sección de registros a un sub-componente `OdontogramaRegistros.jsx` e
  importarlo en `odonto.jsx` sin cambiar ninguna ruta.
- Los datos del SVG siguen en `localStorage` (no en BD). Esta limitación ya
  existía antes de este cambio; la solución definitiva requiere integrar el
  estado del SVG con la API backend, lo que es trabajo futuro independiente.

### Archivos modificados

| Archivo                                                    | Cambio                                                |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| `hc-frontend/src/layouts/HcLayout.jsx`                     | Comentado el item "Odontograma" del sidebar           |
| `hc-frontend/src/App.jsx`                                  | Ruta `/historia/:id/odontograma` comentada            |
| `hc-frontend/src/pages/hc/ExamenFisico/odonto.jsx`         | Sección "Registro de Intervenciones" añadida al final |
| `hc-frontend/src/pages/hc/Odontograma/OdontogramaPage.jsx` | **Sin cambios** — preservado para restauración        |

---

## Reversión

Para restaurar el estado anterior (post-evaluación):

```
1. hc-frontend/src/layouts/HcLayout.jsx
   → Descomentar la línea del array menuItems con 'Odontograma'

2. hc-frontend/src/App.jsx
   → Descomentar el import de OdontogramaPage
   → Descomentar el <Route path="/historia/:id/odontograma" ... />

3. hc-frontend/src/pages/hc/ExamenFisico/odonto.jsx
   → Opcional: eliminar la sección "Registro de Intervenciones" del final del archivo
     (no es necesario para la reversión del link del sidebar)
```

---

## Referencias

- RF-06 — Odontogramas (Lista de RF y RNF.pdf)
- HU-09, HU-10 — Historias de usuario de odontograma
- `hc-frontend/src/pages/hc/ExamenFisico/odonto.jsx`
- `hc-frontend/src/pages/hc/Odontograma/OdontogramaPage.jsx` (preservado)
