# ADR-0014 — Mejoras UX del odontograma (NTS-188 + click en diente) y fix de Diagnóstico

**Estado:** Aceptado ✅
**Fecha:** 2026-05-30
**Decididores:** Equipo Grupo 4 (PM confirmó alcance)
**Requisitos:** RF-06, RNF (tablet), cumplimiento NTS N° 188-MINSA/DGIESP-2022

---

## Contexto

Evaluación del odontograma frente a referencias comerciales recientes (Curve
Dental, Open Dental, Dentrix Ascend, CareStack, guía Dendoo 2025) y a la norma
vigente. Hallazgos:

1. **Norma vigente:** la NTS N° 150-2019 fue **actualizada por la NTS N°
   188-MINSA/DGIESP-2022** (RM N° 559-2022/MINSA). La UI citaba "150".
2. **Sin leyenda visible** de siglas/colores (la norma exige siglas conforme).
3. **Selección de diente por `window.prompt`** (teclear "1.6") — inservible en
   tablet (RNF: las tabletas son el dispositivo principal) y desalineado con
   todo el software comercial, que usa click directo en el diente.
4. **Bug:** el botón "Guardar" de _Diagnóstico en Clínicas_ fallaba.

## Decisiones

### Fix de Diagnóstico en Clínicas

El repositorio insertaba/actualizaba la columna **`id_usuario`**, que **no existe**
en la tabla `diagnostico` (ni en `init.sql` ni en la BD NeonDB). PostgreSQL
lanzaba "column does not exist" → 500. Se **quitó `id_usuario`** del INSERT/UPDATE
(el responsable ya se registra en `alumno_tratante`). El dominio sigue validando
la autenticación (`idUsuario`), pero no se persiste esa columna inexistente.

### Track A — Normativa NTS-188

- **A1:** referencia actualizada a **NTS N° 188-2022** en la UI.
- **A2:** componente **`LeyendaOdonto.jsx`** — leyenda colapsable de los 39
  hallazgos agrupados por color (azul = buen estado, rojo = mal estado, gris =
  sin color obligatorio), siempre disponible en la vista.
- **A3:** **color normativo automático** desde el catálogo (`colorHallazgo()`
  deriva azul/rojo/gris del campo `estado`). Se aplica en la columna "Hallazgo"
  de la tabla y como indicador en el formulario.

### Track B — Click en el diente

- Estado `selectedTooth` en `odonto.jsx`; click en un `.tooth-group` del SVG lo
  selecciona y resalta su etiqueta FDI.
- `odotools.jsx` recibe `selectedTooth`: `askTooth()` devuelve el diente
  seleccionado **sin prompt**; si no hay selección, **cae al `window.prompt`**
  (retrocompatible, vía accesible por teclado).
- Banner "Diente seleccionado: X" + botón "Quitar" en el panel de herramientas.

## Opciones consideradas (Track B)

| Opción                                                  | Resultado                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Reescribir todo el modelo de interacción del SVG        | Rechazada: alto riesgo sobre ~1800 líneas de SVG + `visorOdonto.js`.          |
| **Selección por click con fallback a prompt (elegida)** | Bajo riesgo, retrocompatible, gran ganancia de usabilidad y apta para tablet. |

## Cambios realizados

### Backend

| Archivo                                                               | Cambio                                 |
| --------------------------------------------------------------------- | -------------------------------------- |
| `diagnosticoClinicas/infrastructure/diagnosticoClinicasRepository.js` | Quitar `id_usuario` del INSERT/UPDATE. |

### Frontend

| Archivo                                        | Cambio                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `src/pages/hc/ExamenFisico/hallazgosOdonto.js` | `COLOR_ESTADO`, `colorHallazgo()`.                                       |
| `src/pages/hc/ExamenFisico/LeyendaOdonto.jsx`  | **Nuevo.** Leyenda normativa colapsable.                                 |
| `src/pages/hc/ExamenFisico/odonto.jsx`         | Leyenda; color por estado; selección por click + resaltado; ref NTS-188. |
| `src/pages/hc/ExamenFisico/odotools.jsx`       | `askTooth()` usa `selectedTooth`; banner de selección.                   |

## Consecuencias

### Positivas

- Cumplimiento NTS-188 reforzado (leyenda + colores normativos + referencia correcta).
- Usabilidad estilo software comercial; **apto para tablet** (sin prompts para elegir diente).
- Bug de guardado de Diagnóstico resuelto (validado contra NeonDB con PREPARE).

### Negativas / Riesgos

- El resaltado del diente se hace sobre la etiqueta FDI (no sobre el trazo del
  diente) por la complejidad del `<use>`/`<defs>` del SVG. Suficiente como señal.
- La verificación visual end-to-end (click real) queda como prueba manual
  recomendada (no hay tests de UI por falta de jsdom en el entorno).

## Verificación

- Backend: `npm test` → 1429 passing; columnas de `diagnostico` validadas con `PREPARE`.
- Frontend: `vite build` OK; ESLint sin errores.

## Reversión

- Revertir los commits del fix, Track A y Track B (rama `feature/odontograma-nts150-bloque1`).

## Referencias

- NTS N° 188-MINSA/DGIESP-2022 (actualiza la N° 150-2019)
- Benchmark: Curve Dental, Open Dental, Dentrix Ascend, CareStack, guía Dendoo 2025
- ADR-0009..0013 (Bloques 1-5)
