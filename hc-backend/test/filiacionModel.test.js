import { describe, it, expect, vi, afterEach } from 'vitest';
import Filiacion from '../models/hc/anamnesis/filiacionModel.js';
import pool from '../db/db.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('Filiacion', () => {
  it('create: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await Filiacion.create({ id_historia: 1 });
    expect(result).toEqual({ success: true, id_historia: 1 });
  });

  it('getById: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_filiacion: 1 }] });
    const result = await Filiacion.getById(1);
    expect(result).toEqual({ id_filiacion: 1 });
  });

  it('getById: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await Filiacion.getById(1);
    expect(result).toBeUndefined();
  });

  it('getByHistoria: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_historia: 1 }] });
    const result = await Filiacion.getByHistoria(1);
    expect(result).toEqual({ id_historia: 1 });
  });

  it('getByHistoria: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await Filiacion.getByHistoria(1);
    expect(result).toBeUndefined();
  });

  it('update: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await Filiacion.update(1, {});
    expect(result).toEqual({ success: true, id_historia: 1 });
  });
});
