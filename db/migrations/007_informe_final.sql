-- ============================================================
-- Migración: 007_informe_final
-- RF-13: Informe Final de Intervención del estudiante (ADR-0042)
--
-- Descripción:
--   Crea la tabla informe_final, que persiste cada informe generado por el
--   estudiante para el cierre académico del caso:
--     - COMPILACIÓN: secciones guarda el contenido compilado del caso en JSON
--       (encabezado, procedimientos, odontograma, medicamentos, adjuntos,
--       incidencias y evaluación docente).
--     - HISTORIAL: cada generación es una fila nueva; el historial por
--       historia clínica se consulta ordenado por fecha_generacion.
--     - VALIDACIÓN: estado gobierna la transición generado →
--       enviado_validacion → validado; la transición la protege el agregado
--       InformeFinalAggregate y el envío notifica al docente (tipo
--       'validacion' del módulo de notificaciones).
--   Compatible con MySQL 8.0+ y NeonDB (PostgreSQL).
--
-- Cómo aplicar:
--   MySQL:  mysql -u root -p hc_db < db/migrations/007_informe_final.sql
--   NeonDB: ejecutar el CREATE adaptado (ver NOTAS) en el panel SQL
--   o bien: npm run db:migrate  (runner dialect-aware e idempotente)
--
-- Fecha: 2026-07-08
-- ============================================================

CREATE TABLE IF NOT EXISTS informe_final (
  id_informe       CHAR(36)  NOT NULL PRIMARY KEY,
  id_historia      CHAR(36)  NOT NULL,
  generado_por     CHAR(36)  NOT NULL
    COMMENT 'Estudiante que generó el informe',
  estado           VARCHAR(20) NOT NULL DEFAULT 'generado'
    COMMENT 'generado | enviado_validacion | validado',
  secciones        TEXT      NOT NULL
    COMMENT 'Contenido compilado del informe (JSON)',
  fecha_generacion DATETIME  NOT NULL,
  created_at       DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_informe_final_historia
  ON informe_final (id_historia);

-- ============================================================
-- NOTAS PostgreSQL/NeonDB:
-- 1. CHAR(36) → UUID.
-- 2. DATETIME → TIMESTAMP.
-- 3. Quitar las cláusulas COMMENT '...'.
-- 4. TEXT es válido en ambos dialectos; en NeonDB puede usarse JSONB.
-- ============================================================
