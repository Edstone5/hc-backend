# ADR-0026 — Reporte agregado multi-paciente de prevalencia de caries (RF-12)

- **Estado:** Aceptado
- **Fecha:** 2026-05-31
- **Rama:** `feature/odontograma-nts150` (hc-backend)
- **Ámbito:** `hc-backend` (nuevo endpoint de solo lectura; sin migraciones)
- **Relacionado:** ADR-0010 (catálogo de hallazgos + `CLASE_CPOD`), ADR-0011 (índices CPO-D/CEO-D por historia), checkpoint 30/05 (pendiente "endpoint agregado multi-paciente para reportes RF-12")

## Contexto

El RF-12 pide un dashboard con reportes epidemiológicos (prevalencia de caries,
estado por diente). Hasta ahora el odontograma solo exponía datos **por historia**
(`GET /hc/:id/odontograma`) y los índices CPO-D/CEO-D se derivaban en el cliente
para un paciente (ADR-0011). Faltaba una vista **multi-paciente** que agregara las
entradas de todas las historias.

El mapeo `CLASE_CPOD` (cariado | perdido | obturado) ya existía en
`odontograma/domain/hallazgosCatalogo.js`, así que la agregación reutiliza esa
fuente de verdad.

## Decisión

Tres piezas, siguiendo la arquitectura DDD por capas del proyecto:

1. **Dominio — función pura `agregarReporteOdontograma(filas)`**
   (`odontograma/domain/odontogramaDomain.js`). Recibe filas crudas de
   `odontograma_entrada` (varias historias) y devuelve:
   - `totalPacientes`, `totalEntradas`.
   - `caries`: prevalencia a nivel **paciente** (`pacientesConCaries / totalPacientes`).
   - `cpod`: promedio del índice CPO-D por paciente + componentes (cariado/perdido/obturado).
   - `porDiente`: nº de pacientes con caries por pieza FDI y su prevalencia, ordenado.

   Decisiones de cálculo:
   - **Cada diente se cuenta una sola vez por paciente** (se usan `Set` por clase),
     evitando inflar el CPO-D cuando hay varios registros del mismo diente/superficie.
   - La prevalencia es **a nivel de paciente** (un paciente con ≥1 caries cuenta una
     vez), que es la definición epidemiológica habitual.
   - Es función **pura**: testeable con arrays en memoria, sin BD.

2. **Infraestructura — `listarEntradasParaReporte(filtros)`**
   (`odontograma/infrastructure/odontogramaRepository.js`). `SELECT id_historia,
numero_diente, codigo_hallazgo` con filtros opcionales `tipo`, `alumno`, `desde`,
   `hasta` (parámetros posicionales, portable MySQL/PostgreSQL). Devuelve solo las
   columnas necesarias para la agregación.

3. **Aplicación + ruta — `OdontogramaController.reportePrevalencia`** expuesto en
   `GET /hc/odontograma/reporte/prevalencia`. La ruta se declara **antes** de las
   rutas `/:id/odontograma*` para que `"odontograma"` no sea capturado como `:id`.
   Pasa por `authMiddleware` (igual que el resto de `hcRoutes`).

## Alternativas consideradas

- **Agregar en SQL (GROUP BY):** descartado por ahora; la regla "un diente por
  paciente una sola vez" y la prevalencia a nivel paciente son más claras y
  portables en JS, y el volumen de datos es pequeño (clínica universitaria). Si el
  volumen crece, la función pura puede sustituirse por SQL sin cambiar el contrato.
- **Endpoint fuera de `/hc`:** descartado; se mantiene la coherencia con el resto
  del módulo y el `authMiddleware` ya montado.

## Consecuencias

- El frontend (RF-12) puede consumir un único endpoint para el dashboard de
  prevalencia, con filtros por tipo de odontograma, alumno y rango de fechas.
- La lógica de agregación queda cubierta por tests unitarios puros (rápidos y sin BD).
- Sin migraciones ni cambios de esquema.

## Verificación (Norma de Oro)

- `test/odontograma.reporte.test.js`: 11 casos (8 de la función pura: vacío,
  no-array, conteo de pacientes, prevalencia, CPO-D sin duplicar diente,
  perdido/obturado, códigos sin clase, porDiente ordenado; 3 del controlador:
  200 con payload, normalización de filtros, 500 ante fallo del repo).
- Backend `npm test` → **1465 passing** (1454 + 11).
- Sin cambios en el frontend.
