-- ============================================================
-- Migración: 002_odontograma_tipo_y_svg
-- RF-06 + NTS N° 150-MINSA/2022/DGIESP: Odontograma inicial y evolutivo
--
-- Descripción:
--   1. Añade la columna `tipo` (INICIAL|EVOLUCION) a la tabla
--      odontograma_entrada, para distinguir el odontograma de
--      ingreso (estado en que llegó el paciente) del evolutivo
--      (cambios y tratamientos por diente a lo largo del tiempo).
--   2. Crea la tabla `odontograma_svg`, que persiste el dibujo SVG
--      serializado del odontograma (enfoque híbrido: el SVG da
--      fidelidad visual; las entradas estructuradas de
--      odontograma_entrada alimentan reportes/CPO-D).
--   Compatible con MySQL 8.0+ y NeonDB (PostgreSQL).
--
-- Cómo aplicar:
--   MySQL:    mysql -u root -p hc_db < db/migrations/002_odontograma_tipo_y_svg.sql
--   NeonDB:   pegar el bloque adaptado (ver NOTAS) en el panel SQL
--
-- Valores de `tipo`:
--   INICIAL    → Odontograma de primer ingreso (uno por historia)
--   EVOLUCION  → Odontograma por sesión de tratamiento (varios por historia)
--
-- Fecha: 2026-05-30
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columna `tipo` en odontograma_entrada
--    Default 'EVOLUCION' para no romper las filas ya existentes
--    (todas las entradas previas se asumen evolutivas).
-- ------------------------------------------------------------
ALTER TABLE odontograma_entrada
  ADD COLUMN tipo VARCHAR(12) NOT NULL DEFAULT 'EVOLUCION'
    COMMENT 'INICIAL|EVOLUCION';

-- ------------------------------------------------------------
-- 2. Tabla del SVG serializado (odontograma_svg)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS odontograma_svg (
  id_svg           CHAR(36)    NOT NULL PRIMARY KEY,
  id_historia      CHAR(36)    NOT NULL,
  tipo             VARCHAR(12) NOT NULL
    COMMENT 'INICIAL|EVOLUCION',
  svg              LONGTEXT    NOT NULL
    COMMENT 'SVG serializado del odontograma (XMLSerializer)',
  especificaciones TEXT        NULL,
  observaciones    TEXT        NULL,
  fecha            DATE        NOT NULL DEFAULT (CURRENT_DATE),
  id_usuario       CHAR(36)    NULL
    COMMENT 'Usuario que guardó la versión del SVG',
  created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia)
    ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL
);

-- Índice para recuperar el SVG por historia y tipo, más reciente primero
CREATE INDEX IF NOT EXISTS idx_odonto_svg_historia
  ON odontograma_svg (id_historia, tipo, created_at);

-- ============================================================
-- NOTAS de compatibilidad PostgreSQL / NeonDB:
-- 1. LONGTEXT  → usar TEXT (PostgreSQL no tiene límite práctico en TEXT).
-- 2. DATETIME  → usar TIMESTAMP.
-- 3. DEFAULT (CURRENT_DATE) → DEFAULT CURRENT_DATE (sin paréntesis).
-- 4. Quitar las cláusulas COMMENT '...' (PostgreSQL no las soporta
--    inline; usar COMMENT ON COLUMN ... si se desea documentar).
-- 5. ALTER TABLE ... ADD COLUMN funciona igual en ambos motores.
--    Ejecutar esta migración UNA sola vez (no es idempotente para la
--    columna `tipo`; si ya existe, MySQL/PG lanzarán error que puede
--    ignorarse).
-- ============================================================
