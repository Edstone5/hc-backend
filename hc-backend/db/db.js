import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

// Crear un pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Probar conexión
async function testConnection(log = console.log, errorLog = console.error) {
  try {
    await pool.query('SELECT NOW()');
    log('Conectado a Postgres');
  } catch {
    errorLog('Error al conectar');
  }
}

// Ejecutar solo si no es test
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

export { testConnection };
export default pool;
