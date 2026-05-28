import { describe, it, expect, vi, afterEach } from 'vitest';
import ExamenGeneral from '../models/hc/examenFisico/examenGeneralModel.js';
import pool from '../db/db.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('ExamenGeneral', () => {
  it('create: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_examen: 1 }] });
    const result = await ExamenGeneral.create({ campo: 'valor' });
    expect(result).toEqual({ id_examen: 1 });
  });

  it('create: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await ExamenGeneral.create({ campo: 'valor' });
    expect(result).toBeNull();
  });

  it('getByHistoria: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_examen: 1 }] });
    const result = await ExamenGeneral.getByHistoria(1);
    expect(result).toEqual({ id_examen: 1 });
  });

  it('getByHistoria: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await ExamenGeneral.getByHistoria(1);
    expect(result).toBeNull();
  });

  it('getByHistoria: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await ExamenGeneral.getByHistoria(1);
    expect(result).toBeNull();
  });

  it('update: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_examen: 1 }] });
    const result = await ExamenGeneral.update(1, { campo: 'valor' });
    expect(result).toEqual({ id_examen: 1 });
  });

  it('update: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await ExamenGeneral.update(1, { campo: 'valor' });
    expect(result).toBeNull();
  });
});
