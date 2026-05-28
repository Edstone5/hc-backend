import { describe, it, expect, vi, afterEach } from 'vitest';
import { getAdultHistoriasByStudent } from '../models/hc/hcModels/listaHcAdultos.js';
import pool from '../db/db.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('getAdultHistoriasByStudent', () => {
  it('debería devolver historias si hay resultados', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await getAdultHistoriasByStudent(1);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('debería devolver array vacío si ocurre error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await getAdultHistoriasByStudent(1);
    expect(result).toEqual([]);
  });
});
