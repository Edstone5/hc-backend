-- ============================================================
-- Migración: 006_refresh_token
-- Seguridad: rotación de refresh tokens + lista de revocación (ADR-0028)
--
-- Descripción:
--   Crea la tabla refresh_token, que registra cada refresh token emitido por su
--   identificador único (jti). Habilita:
--     - ROTACIÓN: en cada /users/refresh se revoca el jti usado y se emite uno
--       nuevo (reemplazado_por enlaza la cadena).
--     - REVOCACIÓN: logout y detección de reúso marcan revocado = TRUE.
--     - DETECCIÓN DE REÚSO: si llega un jti ya revocado, se revoca toda la
--       cadena del usuario (posible robo del token).
--   Compatible con MySQL 8.0+ y NeonDB (PostgreSQL).
--
-- Cómo aplicar:
--   MySQL:  mysql -u root -p hc_db < db/migrations/006_refresh_token.sql
--   NeonDB: ejecutar el CREATE adaptado (ver NOTAS) en el panel SQL
--   o bien: npm run db:migrate  (runner dialect-aware e idempotente)
--
-- Fecha: 2026-05-31
-- ============================================================

CREATE TABLE IF NOT EXISTS refresh_token (
  jti            CHAR(36)  NOT NULL PRIMARY KEY,
  id_usuario     CHAR(36)  NOT NULL,
  revocado       BOOLEAN   NOT NULL DEFAULT FALSE,
  reemplazado_por CHAR(36) NULL
    COMMENT 'jti que reemplazó a este (rotación)',
  expira_en      DATETIME  NOT NULL COMMENT 'Caducidad del refresh token',
  created_at     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_usuario ON refresh_token (id_usuario);

-- ============================================================
-- NOTAS PostgreSQL/NeonDB:
-- 1. CHAR(36) → UUID (las claves en NeonDB son UUID nativo).
-- 2. DATETIME → TIMESTAMP.
-- 3. Quitar las cláusulas COMMENT '...'.
-- ============================================================
