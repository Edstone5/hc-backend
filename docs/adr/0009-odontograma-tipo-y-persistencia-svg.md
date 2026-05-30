# ADR-0009 — Odontograma inicial/evolutivo y persistencia híbrida del SVG (RF-06 / NTS N° 150)

**Estado:** Aceptado ✅
**Fecha:** 2026-05-30
**Decididores:** Equipo Grupo 4 (decisión del PM en sesión de trabajo)
**Requisito cubierto:** RF-06 — Odontogramas (inicial y evolutivo)
**Norma aplicable:** NTS N° 150-MINSA/2022/DGIESP (uso del odontograma)

---

## Contexto

Tras la consolidación del odontograma en Examen Físico (ADR-0008), quedaban dos
brechas frente a RF-06 y la NTS N° 150:

1. **No se distinguía el tipo de odontograma.** RF-06 exige dos odontogramas por
   historia: el **inicial** (estado en que llegó el paciente, único por historia)
   y el **evolutivo** (cambios y tratamientos por sesión, múltiple). El sistema
   guardaba todas las entradas sin diferenciarlas.

2. **El dibujo SVG no se persistía en base de datos.** El SVG vivía únicamente en
   `localStorage` (clave `odontogramaVersions_${patientId}`), lo que no sobrevive
   entre dispositivos ni cumple el RNF de almacenamiento en la nube. La ADR-0008
   ya lo había señalado como trabajo futuro.

## Decisión

### 1. Campo `tipo` (INICIAL | EVOLUCION)

Se añade la columna `tipo VARCHAR(12) NOT NULL DEFAULT 'EVOLUCION'` a
`odontograma_entrada`. El default preserva las filas existentes (se asumen
evolutivas). En el dominio se introduce un `TipoVO` que valida el enum.

### 2. Persistencia híbrida del SVG

Se decidió el **enfoque híbrido** (decisión explícita del PM):

- **Tabla nueva `odontograma_svg`**: guarda el SVG serializado completo
  (fidelidad visual del dibujo) + `tipo` + especificaciones + observaciones.
- **Entradas estructuradas** (`odontograma_entrada`): siguen alimentando los
  reportes y los índices futuros (CPO-D, RF-12).

El `localStorage` se conserva como **respaldo offline**; la BD pasa a ser la
fuente oficial.

### 3. Regla de unicidad del INICIAL

El odontograma INICIAL es único por historia. La regla se aplica en dos capas:

- **UI:** el botón "Inicial" se deshabilita si ya existe uno (mostrando su fecha).
- **Guardado:** `saveOdontogramaVersion` bloquea el POST si el tipo es INICIAL y
  ya existe uno.

> Nota: la validación dura (constraint en BD) se evaluará en un sprint
> posterior; por ahora la regla es de aplicación (capa app/UI), suficiente para
> el entorno de pruebas actual.

---

## Opciones consideradas

| Opción                              | Descripción                                              | Resultado                                                                                              |
| ----------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **A — Solo entradas estructuradas** | Reconstruir el dibujo desde los hallazgos diente→código. | Rechazada: requiere motor de render desde datos; alto costo, pierde fidelidad del SVG dibujado a mano. |
| **B — Solo SVG serializado**        | Guardar el dibujo como blob de texto.                    | Rechazada: el SVG no es consultable por diente; rompe RF-12 (reportes por diente).                     |
| **C — Híbrido (elegida)**           | SVG serializado + entradas estructuradas.                | **Elegida:** fidelidad visual (NTS N° 150) y datos consultables (RF-12) a la vez.                      |

---

## Cambios realizados

### Backend (`hc-backend`)

| Archivo                                               | Cambio                                                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db/migrations/002_odontograma_tipo_y_svg.sql`        | **Nuevo.** ALTER `odontograma_entrada` + CREATE `odontograma_svg` + índice. Dual MySQL/PostgreSQL.                                                                  |
| `db/init.sql`                                         | Columna `tipo` añadida a `odontograma_entrada`; tabla `odontograma_svg` e índice añadidos (despliegues nuevos).                                                     |
| `odontograma/domain/odontogramaDomain.js`             | `TipoVO` nuevo; `tipo` en `OdontogramaEntradaAggregate`; `OdontogramaSvgAggregate` nuevo; interfaz de repo ampliada.                                                |
| `odontograma/infrastructure/odontogramaRepository.js` | INSERT/SELECT con `tipo`; métodos `listarSvgPorHistoria`, `guardarSvg`. Fix: fecha por defecto vía `hoyISO()` (antes insertaba el string literal `'CURRENT_DATE'`). |
| `odontograma/application/odontogramaController.js`    | Métodos `listarSvg`, `guardarSvg`.                                                                                                                                  |
| `routes/hcRoutes.js`                                  | Rutas `GET/POST /:id/odontograma/svg` (declaradas antes de `:idEntrada`).                                                                                           |

### Frontend (`hc-frontend`)

| Archivo                                | Cambio                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/services/fetchClinico.js`         | `fetchOdontogramaSvg`, `addOdontogramaSvg`.                                                                                                                              |
| `src/hooks/useClinico.js`              | `useOdontogramaSvg`, `useAddOdontogramaSvg`.                                                                                                                             |
| `src/pages/hc/ExamenFisico/odonto.jsx` | Selector INICIAL/EVOLUCIÓN; guardado del SVG en BD con el tipo activo; bloqueo de segundo INICIAL; columna "Tipo" en la tabla; `tipo` enviado al registrar intervención. |

---

## Consecuencias

### Positivas

- RF-06 cumplido: distinción inicial/evolutivo + persistencia real en BD.
- NTS N° 150: se mantiene el código de colores (azul/rojo) y el dibujo fiel.
- Compatibilidad MySQL + NeonDB conservada (patrón dual del proyecto).
- Retrocompatible: `tipo` con default; el SVG sigue funcionando aunque la BD falle.

### Negativas / Riesgos

- La unicidad del INICIAL aún no es constraint de BD (solo app/UI).
- `odonto.jsx` sigue creciendo; pendiente extraer sub-componentes (ya anotado en ADR-0008).
- La migración `002` no es idempotente para la columna `tipo` (correr una vez).

## Verificación

- Backend: `npm test` → 1401 tests passing, 0 fallos. ESLint sin errores.
- Frontend: `vite build` OK; ESLint sin errores en los archivos tocados.

## Reversión

1. Revertir los archivos listados (rama `feature/odontograma-nts150-bloque1`).
2. `ALTER TABLE odontograma_entrada DROP COLUMN tipo;`
3. `DROP TABLE odontograma_svg;`

## Referencias

- RF-06 — Lista de RF y RNF.pdf
- NTS N° 150-MINSA/2022/DGIESP — SCRUM-MINSA, ISO 28000 (doc. calidad)
- ADR-0008 — Consolidación del odontograma en Examen Físico
