import { describe, it, expect, vi, afterEach } from 'vitest';
import EnfermedadActual from '../models/hc/anamnesis/enfermedadActualModel.js';
import pool from '../db/db.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('EnfermedadActual', () => {
  it('create: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await EnfermedadActual.create({});
    expect(result).toBe(true);
  });

  it('create: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await EnfermedadActual.create({});
    expect(result).toBeNull();
  });

  it('getByHistoria: sin resultados', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await EnfermedadActual.getByHistoria(1);
    expect(result).toBeNull();
  });

  it('getByHistoria: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_historia: 1 }] });
    const result = await EnfermedadActual.getByHistoria(1);
    expect(result).toEqual({ id_historia: 1 });
  });

  it('getByHistoria: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await EnfermedadActual.getByHistoria(1);
    expect(result).toBeNull();
  });

  it('update: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await EnfermedadActual.update(1, {});
    expect(result).toBe(true);
  });

  it('update: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await EnfermedadActual.update(1, {});
    expect(result).toBeNull();
  });
});
