-- ============================================================
-- Migración: 004_iho_simplificado
-- Flujo MINSA / odontopediatría: Índice de Higiene Oral Simplificado (IHO-S)
--
-- Descripción:
--   Crea la tabla iho_s, que registra el Índice de Higiene Oral Simplificado
--   de Greene y Vermillion sobre 6 dientes índice (1.6, 1.1, 2.6, 3.6, 3.1, 4.6),
--   cada uno con índice de detritos (DB, 0-3) y de cálculo (DC, 0-3).
--   El módulo de higiene actual (examen_higiene_oral) solo guarda una
--   evaluación cualitativa; IHO-S es el índice cuantitativo, complementario.
--   Compatible con MySQL 8.0+ y NeonDB (PostgreSQL).
--
-- Cómo aplicar:
--   MySQL:  mysql -u root -p hc_db < db/migrations/004_iho_simplificado.sql
--   NeonDB: ejecutar el CREATE adaptado (ver NOTAS) en el panel SQL
--
-- Fecha: 2026-05-30
-- ============================================================

CREATE TABLE IF NOT EXISTS iho_s (
  id_iho        CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia   CHAR(36)     NOT NULL,
  fecha         DATE         NOT NULL DEFAULT (CURRENT_DATE),
  valores       TEXT         NOT NULL
    COMMENT 'JSON: [{diente, db, dc}] de los 6 dientes índice',
  idb           DECIMAL(4,2) NOT NULL COMMENT 'Índice de detritos (promedio DB)',
  icalc         DECIMAL(4,2) NOT NULL COMMENT 'Índice de cálculo (promedio DC)',
  ihos          DECIMAL(4,2) NOT NULL COMMENT 'IHO-S total = idb + icalc',
  clasificacion VARCHAR(20)  NOT NULL COMMENT 'Bueno|Regular|Malo',
  id_usuario    CHAR(36)     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ihos_historia ON iho_s (id_historia, created_at);

-- ============================================================
-- NOTAS PostgreSQL/NeonDB:
-- 1. DATETIME → TIMESTAMP; DEFAULT (CURRENT_DATE) → DEFAULT CURRENT_DATE.
-- 2. Quitar las cláusulas COMMENT '...'.
-- 3. DECIMAL(4,2) es válido en ambos motores.
-- ============================================================
