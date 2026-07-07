# ADR-0006 — Módulo de Consentimiento Informado (RF-09)

**Estado:** Aceptado ✅  
**Fecha:** 2026-05-30  
**Decididores:** Equipo Grupo 2  
**Requisito cubierto:** RF-09 — Consentimiento Informado

---

## Contexto

RF-09 exige que el sistema permita seleccionar un formato de consentimiento
informado (Anexo 6 del reglamento de la clínica), completar los datos del
paciente y exportar/imprimir el documento antes de iniciar cualquier procedimiento.
Este requisito es de naturaleza **legal**: la práctica clínica sin consentimiento
firmado genera responsabilidad institucional.

El módulo no existía. La única cobertura previa era el campo
`fecha_consentimiento` y `firma_nombre` dentro de `antecedente_cumplimiento`,
que registraba una fecha de consentimiento genérico sin template ni historial.

---

## Decisión

Crear un módulo independiente `consentimiento/` siguiendo la misma arquitectura
hexagonal (Domain → Application → Infrastructure) que los 20 módulos existentes.

### Estructura creada

```
consentimiento/
├── domain/         consentimientoDomain.js
├── application/    consentimientoController.js
└── infrastructure/ consentimientoRepository.js
db/migrations/      001_consentimiento_informado.sql
```

### Templates en el frontend (no en backend)

Los 4 templates de texto (adulto general, cirugía oral, menor de edad,
anestesia local) se implementaron en el frontend en
`consentimientoTemplates.js`, no en el backend.

### Estrategia de impresión: `window.print()` sobre `jsPDF + html2canvas`

Para la generación del documento imprimible se usó `window.print()` con
CSS `@media print`, en lugar de la estrategia html2canvas + jsPDF usada en
el componente `ExportarPDF`.

---

## Opciones consideradas

### Opción A — Templates en el backend, generación PDF server-side

El backend generaría el PDF con `pdfkit` o `puppeteer` y lo enviaría como
respuesta binaria.

**Rechazada porque:**

- Añade dependencias pesadas (`puppeteer` ~130 MB) al backend
- Aumenta la latencia de la primera descarga
- El consentimiento es texto puro — no requiere renderizado de UI compleja
- Complica el flujo de build/CI

### Opción B (elegida) — Templates en frontend, impresión con `window.print()`

Los templates viven en el cliente como funciones JS. La impresión usa el
diálogo nativo del navegador con CSS `@media print` dedicado.

**Ventajas:**

- Impresión instantánea, sin latencia de red
- Compatible con impresoras físicas de la clínica (flujo más natural para el usuario)
- Sin dependencias adicionales en backend ni frontend
- Si se versiona el template, se mueve al backend sin cambiar la interfaz de usuario

### Opción C — Reutilizar `ExportarPDF` (html2canvas)

Usar el mismo componente de captura DOM que el resto del sistema.

**Rechazada porque:**

- html2canvas captura pixels — la tipografía del PDF resultante es de menor
  calidad que texto real para documentos legales
- Los documentos de consentimiento se deben imprimir en papel; la impresión
  directa desde el navegador produce mejores resultados

---

## Consecuencias

### Positivas

- RF-09 completamente cubierto
- La tabla `consentimiento_informado` es consultable para auditorías clínicas
- El campo `firmado` (reservado) permite activar firma digital en fases futuras
  sin modificar el schema (valor `0` hasta entonces)
- Los templates pueden actualizarse sin despliegue backend

### Negativas / Riesgos

- Los templates viven en el cliente: si se requiere versionado anual, habrá
  que considerar moverlos al backend
- `window.print()` abre el diálogo del navegador; no genera un `.pdf` en disco
  automáticamente (requiere acción del usuario en el diálogo de impresión)

### Deuda técnica reconocida

- No hay tests unitarios para el módulo `consentimiento/` en esta entrega.
  Pendiente para el siguiente sprint siguiendo el patrón de los tests existentes.

---

## Referencias

- RF-09 — Consentimiento Informado (Lista de RF y RNF.pdf)
- Historial de User Stories — HU asociadas a RF-09
- Archivo: `hc-frontend/src/pages/hc/ConsentimientoInformado/consentimientoTemplates.js`
