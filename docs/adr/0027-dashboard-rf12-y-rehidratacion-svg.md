# ADR-0027 — Dashboard RF-12 (prevalencia) y rehidratación del editor SVG

- **Estado:** Aceptado
- **Fecha:** 2026-05-31
- **Rama:** `feature/odontograma-nts150` (hc-frontend)
- **Ámbito:** `hc-frontend` (consume APIs ya existentes; sin cambios de backend)
- **Relacionado:** ADR-0026 (endpoint agregado RF-12), ADR-0009/0015 (persistencia SVG en BD y visor de solo lectura)

## Contexto

Dos pendientes del checkpoint quedaban abiertos en el frontend:

1. **Dashboard RF-12:** el backend ya exponía
   `GET /hc/odontograma/reporte/prevalencia` (ADR-0026), pero ningún componente lo
   consumía. Faltaba la vista para el dashboard de prevalencia de caries y CPO-D.
2. **Rehidratar el editor SVG (tarea 3):** el botón "Ver guardado (BD)" mostraba el
   último SVG persistido en **solo lectura** (ADR-0015, Track C2); no se podía
   continuar editando un odontograma guardado, y al abrir la vista el editor
   arrancaba siempre en blanco aunque hubiera un dibujo guardado.

## Decisión

### 1. Dashboard RF-12

- **Servicio** `fetchReporteOdontograma(filtros)` en `services/fetchClinico.js`
  (filtros `tipo`, `alumno`, `desde`, `hasta`).
- **Hook** `useReporteOdontograma(params)` en `hooks/useClinico.js` (React Query).
- **Página** `pages/Admin/ReportesOdontograma.jsx`: tarjetas de resumen (pacientes,
  entradas, prevalencia de caries, CPO-D promedio), componentes CPO-D, gráfico de
  barras de pacientes con caries por diente (chart.js, ya usado en `Reportes.jsx`),
  tabla por diente y exportación CSV. Reutiliza el estilo de `Reportes.jsx`.
- **Ruta** `/admin/reportes/odontograma` en `App.jsx` + acceso rápido en
  `AdminDashboard.jsx`.

### 2. Rehidratación del editor SVG

Nueva función `rehidratarDesdeSvg(svgString)` en `odonto.jsx` que copia del SVG
guardado al SVG **vivo** del editor:

1. El overlay de anotaciones `#odontograma-overlay` (se reemplaza por completo).
2. Los valores de los inputs de cada diente (mapeo **posicional**: el orden del DOM
   es idéntico entre el SVG guardado y el del editor, ambos generados del mismo
   esqueleto de 52 dientes).
3. Los campos de texto: fecha, especificaciones y observaciones.

El esqueleto estático de 52 dientes no se reemplaza (es idéntico), evitando recrear
listeners. Se expone de dos formas:

- **Botón "Cargar guardado (editar)"** junto a "Ver guardado (BD)": carga manual del
  SVG del tipo activo en el editor.
- **Rehidratación automática al abrir**: si existe un SVG guardado del tipo activo y
  el overlay del editor está vacío (el usuario no ha dibujado nada), se precarga una
  sola vez por tipo (`rehidratadoRef`), para mostrar el estado real en lugar de un
  lienzo vacío. No pisa trabajo en curso.

## Alternativas consideradas

- **Reemplazar todo el `<svg>` con `dangerouslySetInnerHTML`:** descartado; rompería
  los listeners de React y el mapeo de clic en dientes. Copiar solo overlay + inputs
  - textos preserva el editor interactivo.
- **Mapear inputs por `data-name` en vez de posición:** equivalente aquí porque el
  orden del DOM es estable; la posición es más simple y ya se usa en
  `saveOdontogramaVersion` (inyección por índice).

## Consecuencias

- RF-12 tiene su dashboard funcional (admin) consumiendo el endpoint agregado.
- El odontograma guardado se puede **continuar editando**, no solo visualizar; al
  reabrir la vista el editor refleja el estado persistido.
- Sin cambios de backend ni de esquema.

## Verificación (Norma de Oro)

- `npx eslint src` → 0 errores.
- `npx vite build` → OK.
- `npm run test:run` → 25 archivos, 136 tests passing (sin regresiones).
- Backend sin cambios (suite sigue en 1465 passing).
- **Pendiente de prueba manual** en navegador: ver el dashboard con datos reales y
  comprobar la rehidratación (cargar guardado → editar → volver a guardar).
