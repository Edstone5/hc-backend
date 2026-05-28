import { describe, it, expect, vi, afterEach } from 'vitest';
import * as AntecedenteModel from '../models/hc/anamnesis/antecedenteModel.js';
import pool from '../db/db.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('AntecedentePersonal', () => {
  it('create: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await AntecedenteModel.AntecedentePersonal.create({});
    expect(result).toBe(true);
  });

  it('create: error', async () => {
    pool.query = vi
      .fn()
      .mockRejectedValue({ message: 'fail', detail: 'detalle' });
    await expect(
      AntecedenteModel.AntecedentePersonal.create({})
    ).rejects.toThrow('fail');
  });

  it('getById: sin resultados', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await AntecedenteModel.AntecedentePersonal.getById(1);
    expect(result).toBeNull();
  });

  it('getById: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_antecedente: 1 }] });
    const result = await AntecedenteModel.AntecedentePersonal.getById(1);
    expect(result).toEqual({ id_antecedente: 1 });
  });

  it('update: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await AntecedenteModel.AntecedentePersonal.update(1, {});
    expect(result).toBe(true);
  });

  it('update: error', async () => {
    pool.query = vi
      .fn()
      .mockRejectedValue({ message: 'fail', detail: 'detalle' });
    await expect(
      AntecedenteModel.AntecedentePersonal.update(1, {})
    ).rejects.toThrow('fail');
  });

  it('update: error sin message', async () => {
    pool.query = vi.fn().mockRejectedValue({});
    await expect(
      AntecedenteModel.AntecedentePersonal.update(1, {})
    ).rejects.toThrow('Error al actualizar antecedente personal');
  });

  // Puedes replicar la misma estructura para AntecedenteMedico, AntecedenteFamiliar y AntecedenteCumplimiento
});

describe('AntecedenteMedico', () => {
  it('create: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await AntecedenteModel.AntecedenteMedico.create({});
    expect(result).toBe(true);
  });

  it('create: error', async () => {
    pool.query = vi.fn().mockRejectedValue({ message: 'fail' });
    await expect(
      AntecedenteModel.AntecedenteMedico.create({})
    ).rejects.toThrow();
  });

  it('getByHistoria: sin resultados', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await AntecedenteModel.AntecedenteMedico.getByHistoria(1);
    expect(result).toBeNull();
  });

  it('getByHistoria: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_historia: 1 }] });
    const result = await AntecedenteModel.AntecedenteMedico.getByHistoria(1);
    expect(result).toEqual({ id_historia: 1 });
  });

  it('getByHistoria: error', async () => {
    pool.query = vi.fn().mockRejectedValue({ message: 'fail' });
    await expect(
      AntecedenteModel.AntecedenteMedico.getByHistoria(1)
    ).rejects.toThrow();
  });

  it('update: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await AntecedenteModel.AntecedenteMedico.update(1, {});
    expect(result).toBe(true);
  });

  it('update: error', async () => {
    pool.query = vi.fn().mockRejectedValue({ message: 'fail' });
    await expect(
      AntecedenteModel.AntecedenteMedico.update(1, {})
    ).rejects.toThrow();
  });
  it('update: error con detail', async () => {
    pool.query = vi
      .fn()
      .mockRejectedValue({ message: 'fail', detail: 'detalle' });
    await expect(
      AntecedenteModel.AntecedenteMedico.update(1, {})
    ).rejects.toThrow();
  });
});

describe('AntecedenteFamiliar', () => {
  it('create: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await AntecedenteModel.AntecedenteFamiliar.create({});
    expect(result).toBe(true);
  });

  it('create: error', async () => {
    pool.query = vi.fn().mockRejectedValue({ message: 'fail' });
    await expect(
      AntecedenteModel.AntecedenteFamiliar.create({})
    ).rejects.toThrow();
  });

  it('getByHistoria: sin resultados', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await AntecedenteModel.AntecedenteFamiliar.getByHistoria(1);
    expect(result).toBeNull();
  });

  it('getByHistoria: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_historia: 1 }] });
    const result = await AntecedenteModel.AntecedenteFamiliar.getByHistoria(1);
    expect(result).toEqual({ id_historia: 1 });
  });
  it('getByHistoria: error', async () => {
    pool.query = vi.fn().mockRejectedValue({ message: 'fail' });
    await expect(
      AntecedenteModel.AntecedenteFamiliar.getByHistoria(1)
    ).rejects.toThrow();
  });

  it('update: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await AntecedenteModel.AntecedenteFamiliar.update(1, {});
    expect(result).toBe(true);
  });

  it('update: error', async () => {
    pool.query = vi.fn().mockRejectedValue({ message: 'fail' });
    await expect(
      AntecedenteModel.AntecedenteFamiliar.update(1, {})
    ).rejects.toThrow();
  });
  it('update: error con detail', async () => {
    pool.query = vi
      .fn()
      .mockRejectedValue({ message: 'fail', detail: 'detalle' });
    await expect(
      AntecedenteModel.AntecedenteFamiliar.update(1, {})
    ).rejects.toThrow();
  });
});

describe('AntecedenteCumplimiento', () => {
  it('create: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await AntecedenteModel.AntecedenteCumplimiento.create({});
    expect(result).toBe(true);
  });

  it('create: error', async () => {
    pool.query = vi.fn().mockRejectedValue({ message: 'fail' });
    await expect(
      AntecedenteModel.AntecedenteCumplimiento.create({})
    ).rejects.toThrow();
  });

  it('getByHistoria: sin resultados', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result =
      await AntecedenteModel.AntecedenteCumplimiento.getByHistoria(1);
    expect(result).toBeNull();
  });

  it('getByHistoria: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_historia: 1 }] });
    const result =
      await AntecedenteModel.AntecedenteCumplimiento.getByHistoria(1);
    expect(result).toEqual({ id_historia: 1 });
  });
  it('getByHistoria: error', async () => {
    pool.query = vi.fn().mockRejectedValue({ message: 'fail' });
    await expect(
      AntecedenteModel.AntecedenteCumplimiento.getByHistoria(1)
    ).rejects.toThrow();
  });

  it('update: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await AntecedenteModel.AntecedenteCumplimiento.update(1, {});
    expect(result).toBe(true);
  });

  it('update: error', async () => {
    pool.query = vi.fn().mockRejectedValue({ message: 'fail' });
    await expect(
      AntecedenteModel.AntecedenteCumplimiento.update(1, {})
    ).rejects.toThrow();
  });
  it('update: error con detail', async () => {
    pool.query = vi
      .fn()
      .mockRejectedValue({ message: 'fail', detail: 'detalle' });
    await expect(
      AntecedenteModel.AntecedenteCumplimiento.update(1, {})
    ).rejects.toThrow();
  });
});
