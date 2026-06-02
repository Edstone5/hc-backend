# ADR-0031 — Scripts de seed: usuario admin y datos para Reporte RF-12

- **Estado:** Aceptado
- **Fecha:** 2026-06-01
- **Rama:** `feature/odontograma-nts150` (hc-backend)
- **Ámbito:** `hc-backend` (`db/seed-admin.mjs`, `db/seed-reporte-odontograma.mjs`)
- **Relacionado:** ADR-0026/0027 (endpoint y dashboard RF-12)

## Contexto

Para las pruebas manuales se necesitaban dos cosas:

1. **Una cuenta de administrador** con credenciales conocidas para probar el panel
   admin (incl. el dashboard RF-12), sin tocar las cuentas reales.
2. **Datos en `odontograma_entrada`**: la BD tenía 120 historias pero solo **1**
   entrada estructurada, así que el reporte RF-12 (y su exportación CSV) salía
   prácticamente vacío. El reporte lee `odontograma_entrada.codigo_hallazgo`, no el
   SVG serializado.

## Decisión

Dos scripts puntuales, idempotentes, que usan el `pool` del proyecto (respetan
`DATABASE_URL`, el dialecto y la arquitectura de acceso a datos):

- **`db/seed-admin.mjs <codigo> <password> [rol]`** — crea o actualiza un usuario.
  Hash real con `argon2.hash`. El `dni` se deriva (CHAR(8)). Si el código ya existe,
  actualiza contraseña/rol/activo (idempotente). El rol por defecto es `admin`, que
  es el de **mayor jerarquía existente** en la BD (roles reales: `estudiante`,
  `admin`) y el que `Dashboard.jsx` usa para renderizar el panel admin. No se crean
  roles nuevos.
- **`db/seed-reporte-odontograma.mjs [--clean]`** — inserta entradas de odontograma
  sobre historias **existentes** (no crea pacientes), con hallazgos variados
  (C/O/R/DEX/Io) sobre dientes FDI. Marca cada fila con `diagnostico='SEED-RF12'`
  para poder limpiarla (`--clean`) y es idempotente (borra antes de reinsertar).

## Alternativas consideradas

- **INSERT manual por SQL/Insomnia:** frágil (hash argon2, FKs, CHAR(8) de dni).
- **Crear pacientes+historias nuevas para el reporte:** innecesario; ya había 120
  historias. Reutilizarlas es más realista y deja menos basura.
- **Seed permanente en `init.sql`:** se evita; son datos de prueba, no semilla
  canónica. Los scripts quedan como utilidades de desarrollo, fuera del runtime.

## Consecuencias

- Cuenta admin de prueba: `2023-119013` / `esis123` (rol `admin`).
- El dashboard RF-12 y la exportación CSV muestran datos reales (15 pacientes,
  prevalencia de caries ~87 %, CPO-D ~4.1, desglose por diente).
- Los datos de prueba son removibles con `--clean` (filtro `SEED-RF12`).
- Los scripts NO se importan desde la app; no afectan a `npm test` (1468 passing).

## Verificación (Norma de Oro)

- `npm test` (backend) → 1468 passing (sin cambios en `src`).
- Ejecución verificada: usuario creado y `argon2.verify` OK; agregación del reporte
  devuelve datos no vacíos.
