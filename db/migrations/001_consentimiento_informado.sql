-- ============================================================
-- Migración: 001_consentimiento_informado
-- RF-09: Módulo de Consentimiento Informado
--
-- Descripción: Crea la tabla que almacena los registros de
--   consentimiento informado vinculados a una historia clínica.
--   Compatible con MySQL 8.0+ y NeonDB (PostgreSQL).
--
-- Cómo aplicar:
--   mysql -u root -p hc_db < db/migrations/001_consentimiento_informado.sql
--   (o ejecutar el bloque en el panel de NeonDB)
--
-- Tipos de template (tipo_template):
--   adulto_general  → Procedimientos generales, paciente adulto
--   cirugia_oral    → Cirugías / exodoncias complejas
--   menor_de_edad   → Paciente menor, requiere datos del tutor
--   anestesia_local → Consentimiento específico para anestesia
--
-- Fecha: 2026-05-30
-- ============================================================

CREATE TABLE IF NOT EXISTS consentimiento_informado (
  id_consentimiento    CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia          CHAR(36)     NOT NULL,
  tipo_template        VARCHAR(50)  NOT NULL
    COMMENT 'adulto_general|cirugia_oral|menor_de_edad|anestesia_local',
  nombre_paciente      VARCHAR(300) NOT NULL,
  nombre_responsable   VARCHAR(300) NULL
    COMMENT 'Para tipo menor_de_edad: nombre del padre/madre/tutor',
  fecha_consentimiento DATE         NOT NULL DEFAULT (CURRENT_DATE),
  firmado              TINYINT(1)   NOT NULL DEFAULT 0
    COMMENT 'Reservado para firma digital futura (Fase 2)',
  id_usuario           CHAR(36)     NULL
    COMMENT 'Usuario que registró el consentimiento en el sistema',
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia)
    ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE SET NULL
);

-- Índice para consultas frecuentes por historia clínica
CREATE INDEX IF NOT EXISTS idx_consentimiento_historia
  ON consentimiento_informado (id_historia, created_at);

-- ============================================================
-- NOTAS:
-- 1. La columna `firmado` está reservada para cuando se habilite
--    firma digital (fase futura). Por ahora siempre es 0.
-- 2. Si en PostgreSQL/NeonDB: reemplazar TINYINT(1) por BOOLEAN
--    y DEFAULT (CURRENT_DATE) por DEFAULT CURRENT_DATE.
-- 3. El campo tipo_template es un enum de texto para mantener
--    compatibilidad con MySQL y PostgreSQL sin DDL adicional.
-- ============================================================
