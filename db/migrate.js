/**
 * Runner de migraciones incrementales del backend (001-007), dialect-aware.
 *
 * Aplica de una sola vez, sobre una BD base ya inicializada (hc-db
 * deploy_full.sql en PostgreSQL o init.sql en MySQL), las migraciones del
 * backend:
 *   001 — tabla consentimiento_informado (RF-09)
 *   002 — columna `tipo` en odontograma_entrada + tabla odontograma_svg
 *   003 — columna `codigo_hallazgo` en odontograma_entrada
 *   004 — tabla iho_s (IHO-S)
 *   005 — tabla epb (Examen Periodontal Básico)
 *   006 — tabla refresh_token (rotación/revocación, ADR-0028)
 *   007 — tabla informe_final (RF-13, ADR-0042)
 *
 * Es DIALECT-AWARE (MySQL / PostgreSQL, según DATABASE_URL en db.js) e
 * IDEMPOTENTE: tolera los errores de "ya existe" para poder re-ejecutarse sin
 * romper. Si la BD se creó desde init.sql actualizado, este runner no hará nada
 * (todo existe) y terminará igual con éxito.
 *
 * Uso:
 *   npm run db:migrate
 *   (lee DATABASE_URL del entorno, igual que el resto del backend)
 */
import pool, { testConnection } from './db.js';

const isMysql = pool.dialect === 'mysql';

// Helpers de tipos por dialecto.
const TEXT_LARGE = isMysql ? 'LONGTEXT' : 'TEXT';
const DT = isMysql ? 'DATETIME' : 'TIMESTAMP';
const DEF_DATE = isMysql ? 'DEFAULT (CURRENT_DATE)' : 'DEFAULT CURRENT_DATE';
// Tipo de las columnas de identificador. En la BD PostgreSQL/NeonDB las claves
// (id_historia, id_usuario, ...) son UUID nativo; en MySQL son CHAR(36). Los
// FOREIGN KEY exigen que el tipo coincida con la columna referenciada.
const IDT = isMysql ? 'CHAR(36)' : 'UUID';
// COMMENT inline solo es válido en MySQL.
const C = (txt) => (isMysql ? ` COMMENT '${txt}'` : '');

// ¿El error indica que el objeto ya existe? (idempotencia)
function esYaExiste(err) {
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('already exists') ||
    msg.includes('duplicate column') ||
    msg.includes('duplicate key name') ||
    msg.includes('exists') ||
    err?.code === 'ER_DUP_FIELDNAME' ||
    err?.code === 'ER_DUP_KEYNAME' ||
    err?.code === '42701' || // pg: duplicate_column
    err?.code === '42P07' // pg: duplicate_table
  );
}

// Migraciones como lista de pasos {nombre, sql}.
const PASOS = [
  // ── 001: consentimiento_informado (RF-09) ─────────────────────────────────
  {
    nombre: '001 · tabla consentimiento_informado',
    sql: `CREATE TABLE IF NOT EXISTS consentimiento_informado (
            id_consentimiento    ${IDT}       NOT NULL PRIMARY KEY,
            id_historia          ${IDT}       NOT NULL,
            tipo_template        VARCHAR(50)  NOT NULL${C('adulto_general|cirugia_oral|menor_de_edad|anestesia_local')},
            nombre_paciente      VARCHAR(300) NOT NULL,
            nombre_responsable   VARCHAR(300) NULL${C('Para menor_de_edad: padre/madre/tutor')},
            fecha_consentimiento DATE         NOT NULL ${DEF_DATE},
            firmado              BOOLEAN      NOT NULL DEFAULT FALSE${C('Reservado para firma digital (Fase 2)')},
            id_usuario           ${IDT}       NULL${C('Usuario que registró el consentimiento')},
            created_at           ${DT}        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
            FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
          )`,
  },
  {
    nombre: '001 · idx_consentimiento_historia',
    sql: `CREATE INDEX idx_consentimiento_historia ON consentimiento_informado (id_historia, created_at)`,
  },

  // ── 002: tipo + odontograma_svg ──────────────────────────────────────────
  {
    nombre: '002 · odontograma_entrada.tipo',
    sql: `ALTER TABLE odontograma_entrada
            ADD COLUMN tipo VARCHAR(12) NOT NULL DEFAULT 'EVOLUCION'${C('INICIAL|EVOLUCION (RF-06)')}`,
  },
  {
    nombre: '002 · tabla odontograma_svg',
    sql: `CREATE TABLE IF NOT EXISTS odontograma_svg (
            id_svg           ${IDT}    NOT NULL PRIMARY KEY,
            id_historia      ${IDT}    NOT NULL,
            tipo             VARCHAR(12) NOT NULL${C('INICIAL|EVOLUCION')},
            svg              ${TEXT_LARGE} NOT NULL${C('SVG serializado (XMLSerializer)')},
            especificaciones TEXT        NULL,
            observaciones    TEXT        NULL,
            fecha            DATE        NOT NULL ${DEF_DATE},
            id_usuario       ${IDT}    NULL,
            created_at       ${DT}    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
            FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
          )`,
  },
  {
    nombre: '002 · idx_odonto_svg_historia',
    sql: `CREATE INDEX idx_odonto_svg_historia ON odontograma_svg (id_historia, tipo, created_at)`,
  },

  // ── 003: codigo_hallazgo ─────────────────────────────────────────────────
  {
    nombre: '003 · odontograma_entrada.codigo_hallazgo',
    sql: `ALTER TABLE odontograma_entrada
            ADD COLUMN codigo_hallazgo VARCHAR(10) NULL${C('Código catálogo SIHCE/NTS-150')}`,
  },
  {
    nombre: '003 · idx_odonto_hallazgo',
    sql: `CREATE INDEX idx_odonto_hallazgo ON odontograma_entrada (codigo_hallazgo)`,
  },

  // ── 004: iho_s ───────────────────────────────────────────────────────────
  {
    nombre: '004 · tabla iho_s',
    sql: `CREATE TABLE IF NOT EXISTS iho_s (
            id_iho        ${IDT}     NOT NULL PRIMARY KEY,
            id_historia   ${IDT}     NOT NULL,
            fecha         DATE         NOT NULL ${DEF_DATE},
            valores       TEXT         NOT NULL${C('JSON: [{diente, db, dc}] 6 dientes índice')},
            idb           DECIMAL(4,2) NOT NULL${C('Índice de detritos (promedio DB)')},
            icalc         DECIMAL(4,2) NOT NULL${C('Índice de cálculo (promedio DC)')},
            ihos          DECIMAL(4,2) NOT NULL${C('IHO-S total = idb + icalc')},
            clasificacion VARCHAR(20)  NOT NULL${C('Bueno|Regular|Malo')},
            id_usuario    ${IDT}     NULL,
            created_at    ${DT}     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
            FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
          )`,
  },
  {
    nombre: '004 · idx_ihos_historia',
    sql: `CREATE INDEX idx_ihos_historia ON iho_s (id_historia, created_at)`,
  },

  // ── 005: epb ─────────────────────────────────────────────────────────────
  {
    nombre: '005 · tabla epb',
    sql: `CREATE TABLE IF NOT EXISTS epb (
            id_epb       ${IDT}  NOT NULL PRIMARY KEY,
            id_historia  ${IDT}  NOT NULL,
            fecha        DATE      NOT NULL ${DEF_DATE},
            valores      TEXT      NOT NULL${C('JSON: [{sextante, codigo, furca, movilidad}]')},
            codigo_max   SMALLINT  NOT NULL${C('Peor código OMS (0-4)')},
            id_usuario   ${IDT}  NULL,
            created_at   ${DT}  NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
            FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
          )`,
  },
  {
    nombre: '005 · idx_epb_historia',
    sql: `CREATE INDEX idx_epb_historia ON epb (id_historia, created_at)`,
  },
  // ── 006: refresh_token (rotación + revocación, ADR-0028) ───────────────────
  {
    nombre: '006 · tabla refresh_token',
    sql: `CREATE TABLE IF NOT EXISTS refresh_token (
            jti             ${IDT}    NOT NULL PRIMARY KEY,
            id_usuario      ${IDT}    NOT NULL,
            revocado        BOOLEAN   NOT NULL DEFAULT FALSE,
            reemplazado_por ${IDT}    NULL${C('jti que reemplazó a este (rotación)')},
            expira_en       ${DT}     NOT NULL${C('Caducidad del refresh token')},
            created_at      ${DT}     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
          )`,
  },
  {
    nombre: '006 · idx_refresh_usuario',
    sql: `CREATE INDEX idx_refresh_usuario ON refresh_token (id_usuario)`,
  },

  // ── 007: informe_final (RF-13, ADR-0042) ──────────────────────────────────
  {
    nombre: '007 · tabla informe_final',
    sql: `CREATE TABLE IF NOT EXISTS informe_final (
            id_informe       ${IDT}        NOT NULL PRIMARY KEY,
            id_historia      ${IDT}        NOT NULL,
            generado_por     ${IDT}        NOT NULL${C('Estudiante que generó el informe')},
            estado           VARCHAR(20)   NOT NULL DEFAULT 'generado'${C('generado | enviado_validacion | validado')},
            secciones        ${TEXT_LARGE} NOT NULL${C('Contenido compilado del informe (JSON)')},
            fecha_generacion ${DT}         NOT NULL,
            created_at       ${DT}         NOT NULL DEFAULT CURRENT_TIMESTAMP
          )`,
  },
  {
    nombre: '007 · idx_informe_final_historia',
    sql: `CREATE INDEX idx_informe_final_historia ON informe_final (id_historia)`,
  },
];

async function migrar() {
  await testConnection();
  console.log(
    `\n▶ Aplicando migraciones del backend 001-007 (dialecto: ${pool.dialect})\n`
  );

  let aplicados = 0;
  let omitidos = 0;

  for (const paso of PASOS) {
    try {
      await pool.query(paso.sql);
      aplicados++;
      console.log(`  ✅ ${paso.nombre}`);
    } catch (err) {
      if (esYaExiste(err)) {
        omitidos++;
        console.log(`  ⏭️  ${paso.nombre} (ya existía)`);
      } else {
        console.error(`  ❌ ${paso.nombre}\n     ${err.message}`);
        throw err;
      }
    }
  }

  console.log(
    `\n✔ Migración completada — ${aplicados} aplicados, ${omitidos} omitidos.\n`
  );
}

migrar()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n✖ Migración abortada:', err.message, '\n');
    process.exit(1);
  });
