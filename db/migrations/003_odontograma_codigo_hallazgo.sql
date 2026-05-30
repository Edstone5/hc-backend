-- ============================================================
-- Migración: 003_odontograma_codigo_hallazgo
-- RF-06 + NTS N° 150-MINSA/2022/DGIESP: nomenclatura oficial de hallazgos
--
-- Descripción:
--   Añade la columna `codigo_hallazgo` a odontograma_entrada para registrar
--   el hallazgo según el catálogo oficial SIHCE/MINSA (39 hallazgos), en lugar
--   de texto libre. El campo `diagnostico` se conserva como descripción /
--   observación complementaria (retrocompatibilidad con filas previas).
--   Compatible con MySQL 8.0+ y NeonDB (PostgreSQL).
--
-- Cómo aplicar:
--   MySQL:  mysql -u root -p hc_db < db/migrations/003_odontograma_codigo_hallazgo.sql
--   NeonDB: ejecutar el ALTER (sin la cláusula COMMENT) en el panel SQL
--
-- Fecha: 2026-05-30
-- ============================================================

ALTER TABLE odontograma_entrada
  ADD COLUMN codigo_hallazgo VARCHAR(10) NULL
    COMMENT 'Código del catálogo SIHCE/NTS-150 (C, O, R, Co, DEX, ...)';

-- Índice para reportes por hallazgo (RF-12: prevalencia de caries, etc.)
CREATE INDEX IF NOT EXISTS idx_odonto_hallazgo
  ON odontograma_entrada (codigo_hallazgo);

-- ============================================================
-- NOTAS PostgreSQL/NeonDB:
-- 1. Quitar la cláusula COMMENT '...' (usar COMMENT ON COLUMN si se desea).
-- 2. ALTER ... ADD COLUMN funciona igual; ejecutar una sola vez.
-- 3. El catálogo de los 39 códigos vive en el dominio de la aplicación
--    (odontograma/domain/hallazgosCatalogo.js); no se modela como tabla
--    para mantener la migración simple y sin seeds adicionales.
-- ============================================================
