/**
 * Adaptador de base de datos — soporta PostgreSQL y MySQL.
 *
 * Detecta el dialecto desde DATABASE_URL:
 *   mysql:// | mysql2://  → mysql2 (placeholders $N convertidos a ?)
 *   postgres:// | postgresql:// → pg / NeonDB (sin conversión)
 *
 * Interfaz unificada:
 *   pool.query(sql, params) → Promise<{ rows }>
 *   pool.dialect            → 'pg' | 'mysql'
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DATABASE_URL || '';
const isMysql = /^mysql2?:\/\//i.test(DB_URL);

/** Convierte placeholders $1,$2,... a ? para MySQL */
function convertPlaceholders(sql) {
  return sql.replace(/\$\d+/g, '?');
}

let pool;

if (isMysql) {
  const mysql2 = await import('mysql2/promise');
  const mysqlPool = mysql2.default.createPool({
    uri: DB_URL,
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
  });

  pool = {
    dialect: 'mysql',
    async query(sql, params = []) {
      const [rows] = await mysqlPool.execute(
        convertPlaceholders(sql),
        params ?? []
      );
      return { rows: Array.isArray(rows) ? rows : [] };
    },
  };
} else {
  const { Pool } = pg;
  // SSL solo cuando el destino lo exige (Neon/nube usa sslmode=require). Un
  // PostgreSQL local (Docker, hc-db) no habla SSL, así que para él se desactiva.
  // Así `npm run dev` contra Neon sigue igual y el compose local funciona.
  const requiereSSL =
    /sslmode=require/i.test(DB_URL) || /\.neon\.tech/i.test(DB_URL);
  const pgPool = new Pool({
    connectionString: DB_URL,
    ssl: requiereSSL ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool = {
    dialect: 'pg',
    async query(sql, params = []) {
      const result = await pgPool.query(sql, params ?? []);
      return { rows: result.rows };
    },
  };
}

async function testConnection(log = console.log, errorLog = console.error) {
  try {
    await pool.query('SELECT 1');
    log(
      `Conectado a base de datos (${pool.dialect === 'mysql' ? 'MySQL' : 'PostgreSQL'})`
    );
  } catch {
    errorLog('Error al conectar a la base de datos');
  }
}

if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

export { testConnection };
export default pool;
