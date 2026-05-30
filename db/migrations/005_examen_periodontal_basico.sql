-- ============================================================
-- Migración: 005_examen_periodontal_basico
-- Flujo MINSA / periodoncia: Examen Periodontal Básico (EPB / PSR)
--
-- Descripción:
--   Crea la tabla epb, que registra el Periodontal Screening and Recording
--   (PSR/EPB) por sextante. Se divide la boca en 6 sextantes; a cada uno se le
--   asigna un código OMS 0-4, con marcadores opcionales de furca (*) y
--   movilidad. La clínica UNJBG realiza tratamiento periodontal, por lo que
--   este examen forma parte del flujo de atención.
--   Compatible con MySQL 8.0+ y NeonDB (PostgreSQL).
--
-- Códigos OMS (sonda OMS):
--   0 → sano; 1 → sangrado al sondaje; 2 → cálculo/obturación desbordante;
--   3 → bolsa 3.5-5.5 mm; 4 → bolsa ≥ 6 mm.
--
-- Sextantes (FDI): S1 1.8-1.4, S2 1.3-2.3, S3 2.4-2.8,
--                  S4 3.8-3.4, S5 3.3-4.3, S6 4.4-4.8.
--
-- Cómo aplicar:
--   MySQL:  mysql -u root -p hc_db < db/migrations/005_examen_periodontal_basico.sql
--   NeonDB: ejecutar el CREATE adaptado (ver NOTAS) en el panel SQL
--
-- Fecha: 2026-05-30
-- ============================================================

CREATE TABLE IF NOT EXISTS epb (
  id_epb       CHAR(36)  NOT NULL PRIMARY KEY,
  id_historia  CHAR(36)  NOT NULL,
  fecha        DATE      NOT NULL DEFAULT (CURRENT_DATE),
  valores      TEXT      NOT NULL
    COMMENT 'JSON: [{sextante, codigo, furca, movilidad}] 6 sextantes',
  codigo_max   SMALLINT  NOT NULL COMMENT 'Peor código OMS (0-4) para resumen',
  id_usuario   CHAR(36)  NULL,
  created_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_epb_historia ON epb (id_historia, created_at);

-- ============================================================
-- NOTAS PostgreSQL/NeonDB:
-- 1. DATETIME → TIMESTAMP; DEFAULT (CURRENT_DATE) → DEFAULT CURRENT_DATE.
-- 2. Quitar las cláusulas COMMENT '...'.
-- ============================================================
