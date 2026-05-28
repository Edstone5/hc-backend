import { describe, it, expect, vi, afterEach } from 'vitest';
import { PatientModel } from '../models/patient/patientModel.js';
import pool from '../db/db.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('PatientModel', () => {
  it('createPatient: éxito', async () => {
    pool.query = vi
      .fn()
      .mockResolvedValue({ rows: [{ id_paciente: 'uuid-123' }] });
    const result = await PatientModel.createPatient(
      'Juan',
      'Perez',
      '12345678',
      '2000-01-01',
      'M',
      '999999999',
      'juan@mail.com'
    );
    expect(result).toEqual({ id: 'uuid-123' });
  });

  it('createPatient: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      PatientModel.createPatient(
        'Juan',
        'Perez',
        '12345678',
        '2000-01-01',
        'M',
        '999999999',
        'juan@mail.com'
      )
    ).rejects.toThrow('fail');
  });

  it('updatePatient: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await PatientModel.updatePatient(
      'uuid-123',
      'Juan',
      'Perez',
      '999999999',
      'juan@mail.com'
    );
    expect(result).toBe(true);
  });

  it('updatePatient: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      PatientModel.updatePatient(
        'uuid-123',
        'Juan',
        'Perez',
        '999999999',
        'juan@mail.com'
      )
    ).rejects.toThrow('fail');
  });
});
