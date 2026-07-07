# ADR-0015 — Odontograma: integración BD, export PDF (Track C) y refactor (Track D)

**Estado:** Aceptado ✅
**Fecha:** 2026-05-30
**Decididores:** Equipo Grupo 2 (PM pidió "terminar los tracks")
**Requisitos:** RF-06, RF-08 (PDF), RNF (tablet/mantenibilidad)

---

## Contexto

Cierre de los tracks propuestos en la evaluación del odontograma (ver ADR-0014).
Tras Track A (normativa) y Track B (click en diente), quedaban:

- **Track C** — integración SVG ↔ registro estructurado, precarga y export PDF.
- **Track D** — deuda técnica (componente gigante, SVG no responsive).

## Decisiones

### Track C — Integración y export

- **C1 (prefill seguro):** al abrir el formulario de "Nueva intervención", si hay
  un diente seleccionado por click en el SVG, se prefija `numeroDiente`
  (`"1.6"` → FDI `"16"`). Conecta la selección visual con el registro
  estructurado **sin** auto-crear datos (humano en el bucle).
  > Se descartó el auto-registro completo herramienta→hallazgo: el mapeo tiene
  > ambigüedades (p. ej. defecto "O" vs amalgama "O", "CM" vs "Co"), y crear
  > registros clínicos automáticamente sin revisión es riesgoso.
- **C2 (vista BD):** botón "Ver guardado (BD)" que muestra, en solo lectura, el
  último SVG persistido (tabla `odontograma_svg`) del tipo activo. No rehidrata
  el editor (eso sería riesgoso sobre el SVG vivo); es un visor fiel.
- **C3 (PDF):** se reutiliza el componente existente `ExportarPDF`
  (jsPDF + html2canvas, con header institucional y auditoría). Captura el
  contenedor `#odontograma-export`.

### Track D — Refactor

- **D1 (responsive):** el `<svg>` pasa de `width/height=1400` fijos a
  `width="100%" height="auto"` con `viewBox` + `preserveAspectRatio`, escalando
  al contenedor (apto para tablet).
- **D2 (extracción):** la sección "Registro de Intervenciones" (~620 líneas) se
  extrajo a **`OdontogramaRegistros.jsx`**, componente autocontenido (su propio
  formulario + hooks). `odonto.jsx` conserva `useOdontograma` solo-lectura para
  los índices; **React Query deduplica** la query (mismo `queryKey`) con la del
  hijo. `odonto.jsx` pasó de ~2900 a ~2390 líneas.

## Cambios realizados (Frontend)

| Archivo                                              | Cambio                                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/hc/ExamenFisico/OdontogramaRegistros.jsx` | **Nuevo.** Form + tabla de intervenciones (extraído).                                                                               |
| `src/pages/hc/ExamenFisico/odonto.jsx`               | C1 prefill, C2 visor BD, C3 botón PDF, D1 SVG responsive, D2 usa `<OdontogramaRegistros>`; limpieza de estado/hooks/consts muertos. |

(Backend sin cambios funcionales en este lote.)

## Consecuencias

### Positivas

- Selección por click conectada al registro estructurado (C1).
- El SVG guardado en BD es consultable en solo lectura (C2).
- Export a PDF del odontograma (C3, apoya RF-08/RF-13).
- SVG responsive (tablet) y `odonto.jsx` más mantenible (D).

### Negativas / Riesgos

- C1 no auto-crea hallazgos (decisión deliberada por ambigüedad de mapeo).
- C2 no rehidrata el editor desde BD (solo visor); rehidratación es trabajo futuro.
- Verificación end-to-end (PDF, click, visor) recomendada como prueba manual
  (sin tests UI por falta de jsdom en el entorno).

## Verificación

- Frontend: `vite build` OK; ESLint sin errores (sin código muerto tras la extracción).
- Backend: sin cambios; `npm test` permanece en 1429 passing.

## Reversión

- Revertir los commits de Track C (`8a64756`) y Track D (`84859a2`).

## Referencias

- ADR-0014 (Track A + B + fix Diagnóstico)
- Benchmark comercial (Curve, Open Dental, Dentrix, CareStack) — vista dual, PDF, responsive
- PLAN_ODONTOGRAMA_NTS150.md
