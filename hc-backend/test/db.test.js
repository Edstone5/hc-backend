import { describe, it, vi, expect, afterEach } from 'vitest';
import pool from '../db/db.js';

// Mock para pool.query
const originalQuery = pool.query;

describe('testConnection', () => {
  afterEach(() => {
    pool.query = originalQuery;
  });

  it('debería conectar exitosamente a la base de datos', async () => {
    pool.query = vi
      .fn()
      .mockResolvedValue({ rows: [{ now: '2025-12-02T00:00:00.000Z' }] });
    let logMsg = '';
    const log = vi.fn((msg) => {
      logMsg = msg;
    });
    // Usar función de log local en vez de console.log

    // Importar la función testConnection de db.js
    const { testConnection } = await import('../db/db.js');
    // Llamar testConnection pasando la función log como argumento si es posible
    await testConnection(log);
    expect(logMsg).toMatch(/Conectado a Postgres/);
  });

  it('debería manejar error de conexión', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('Fallo de conexión'));
    let errorMsg = '';
    const error = vi.fn((msg) => {
      errorMsg = msg;
    });
    // Usar función de error local en vez de console.error

    const { testConnection } = await import('../db/db.js');
    // Llamar testConnection pasando la función error como argumento si es posible
    await testConnection(undefined, error);
    expect(errorMsg).toMatch(/Error al conectar/);
  });
});
