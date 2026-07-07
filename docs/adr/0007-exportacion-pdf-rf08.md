# ADR-0007 — Mejora de Exportación PDF (RF-08)

**Estado:** Aceptado ✅  
**Fecha:** 2026-05-30  
**Decididores:** Equipo Grupo 2  
**Requisito cubierto:** RF-08 — Exportar/Imprimir en PDF

---

## Contexto

El componente `ExportarPDF.jsx` ya existía y generaba PDFs funcionales usando
`jsPDF + html2canvas`. Sin embargo, tenía tres brechas frente al criterio de
aceptación de RF-08:

1. **Usuario no incluido**: el header solo mostraba un texto genérico
   ("Sistema HC Digital"), no el nombre del usuario autenticado que generó el
   documento.
2. **Sin paginación**: documentos de más de una página no tenían numeración
   ("Pág. X de N").
3. **Sin trazabilidad**: la exportación de un documento clínico sensible no
   quedaba registrada en la tabla `auditoria`.
4. **Botones visibles en PDF**: los botones de acción del DOM aparecían capturados
   en el PDF junto con el contenido clínico.

---

## Decisión

### 1. Mejorar `ExportarPDF.jsx` (sin reescribir la estrategia base)

Mantener `jsPDF + html2canvas` como estrategia de captura. Los cambios son
**aditivos** sobre el componente existente:

- Header con banda institucional (color primario), nombre del usuario (`prop usuario`)
  y timestamp formateado en español peruano (`es-PE`)
- Footer en cada página con número de hoja ("Pág. X de N") y nombre del archivo
- Pre-cálculo del total de páginas antes de iniciar el loop de renderizado
- Exclusión de elementos de UI del capture: via prop `ignoreElements` de
  html2canvas (detecta `data-pdf-hidden="true"` y elementos `BUTTON`)
- Nuevas props: `idHistoria` (para auditoría) y `usuario` (para el header)

### 2. Crear endpoint `POST /hc/:id/exportar-pdf`

Endpoint sin lógica de negocio. Su única función es ser interceptado por el
`auditoriaMW` existente, que registra automáticamente en la tabla `auditoria`:
usuario, operación (`POST`), IP, user-agent, timestamp, e `id_registro_afectado`.

La llamada al endpoint se hace de forma asíncrona desde el cliente **después**
de descargar el PDF, sin bloquear la UI.

---

## Opciones consideradas

### Opción A (elegida) — Auditoría vía middleware existente

Crear un endpoint dummy `POST /hc/:id/exportar-pdf` capturado por `auditoriaMW`.

**Elegida porque:**

- Cero duplicación de lógica de auditoría
- El middleware ya está probado (tests en `test/auditoriaMiddleware.test.js`)
- La latencia del registro no impacta la descarga del PDF (llamada fire-and-forget)

### Opción B — Registrar desde el frontend directamente en tabla `auditoria`

El frontend haría una llamada directa a `POST /api/auditoria`.

**Rechazada porque:**

- Expondría un endpoint de escritura de auditoría sin validación de dominio
- La tabla `auditoria` se llena desde el backend; mezclar fuentes rompe la
  integridad del log

### Opción C — Generar PDF en el servidor

El backend genera el PDF con `puppeteer` o `pdfkit`.

**Rechazada porque:**

- Latencia inaceptable para documentos grandes
- Requiere que el servidor renderice el DOM del frontend (complejidad alta)
- Los PDFs generados con html2canvas son fielmente visuales — son lo que
  el usuario ve en pantalla, que es el requisito real

---

## Consecuencias

### Positivas

- Toda exportación de documento clínico queda trazada en `auditoria` (cumple RGPD/HIPAA básico)
- El header con usuario y timestamp cumple el criterio "incluye usuario que lo generó"
- Los botones e íconos no aparecen en el PDF exportado
- La paginación hace el documento imprimible en papel de forma profesional

### Negativas / Riesgos

- Los componentes que usen `ExportarPDF` deben pasar las nuevas props `idHistoria`
  y `usuario` para que el header sea correcto; si no las pasan, el header muestra
  valor por defecto ("Usuario del sistema")
- `html2canvas` tiene limitaciones con SVGs complejos (como el odontograma). Para
  esos casos, `window.print()` es más apropiado (ver ADR-0006)

---

## Referencias

- RF-08 — Exportar/Imprimir en PDF (Lista de RF y RNF.pdf)
- `hc-frontend/src/components/PdfExport/ExportarPDF.jsx`
- `hc-backend/middlewares/auditoriaMW.js`
