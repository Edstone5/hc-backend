import { describe, it, expect, vi, afterEach } from 'vitest';
import { HcModel } from '../models/hc/hcModel.js';
import pool from '../db/db.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('HcModel', () => {
  it('createReview: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.createReview({
      idHistory: 1,
      idTeacher: 2,
      state: 'aprobado',
      observations: 'ok',
    });
    expect(result).toBe(true);
  });

  it('createReview: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await HcModel.createReview({
      idHistory: 1,
      idTeacher: 2,
      state: 'aprobado',
      observations: 'ok',
    });
    expect(result).toBeNull();
  });

  it('getFiliationByIdHistory: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_historia: 1 }] });
    const result = await HcModel.getFiliationByIdHistory(1);
    expect(result).toEqual({ id_historia: 1 });
  });

  it('getFiliationByIdHistory: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.getFiliationByIdHistory(1);
    expect(result).toBeNull();
  });

  it('registerHc: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_historia: 1 }] });
    const result = await HcModel.registerHc(1);
    expect(result).toEqual({ id_historia: 1 });
  });

  it('registerHc: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.registerHc(1);
    expect(result).toBeNull();
  });

  it('getAllByStudentId: devuelve array', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_historia: 1 }] });
    const result = await HcModel.getAllByStudentId(1);
    expect(result).toEqual([{ id_historia: 1 }]);
  });

  it('createDraft: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_historia: 1 }] });
    const result = await HcModel.createDraft(1);
    expect(result).toEqual({ id_historia: 1 });
  });

  it('assignPatient: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    await expect(HcModel.assignPatient(1, 2)).resolves.toBeUndefined();
  });

  it('getPatientByHistory: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_paciente: 1 }] });
    const result = await HcModel.getPatientByHistory(1);
    expect(result).toEqual({ id_paciente: 1 });
  });

  it('getPatientByHistory: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.getPatientByHistory(1);
    expect(result).toBeNull();
  });

  it('updateFiliation: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.updateFiliation({ idHistory: 1 });
    expect(result).toBe(true);
  });

  it('updateFiliation: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.updateFiliation({ idHistory: 1 })).rejects.toThrow(
      'fail'
    );
  });

  it('getGeneralExam: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ posicion: 'normal' }] });
    const result = await HcModel.getGeneralExam(1);
    expect(result.posicion).toBe('normal');
  });

  it('getGeneralExam: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.getGeneralExam(1);
    expect(result).toBeNull();
  });

  it('getGeneralExam: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.getGeneralExam(1)).rejects.toThrow('fail');
  });

  it('updateGeneralExam: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.updateGeneralExam({ idHistory: 1 });
    expect(result).toBe(true);
  });

  it('updateGeneralExam: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.updateGeneralExam({ idHistory: 1 })).rejects.toThrow(
      'fail'
    );
  });

  // Puedes replicar la misma estructura para los demás métodos si necesitas cobertura total

  it('getRegionalExam: con resultado', async () => {
    pool.query = vi
      .fn()
      .mockResolvedValue({ rows: [{ cabeza_posicion: 'normal' }] });
    const result = await HcModel.getRegionalExam(1);
    expect(result.cabezaPosicion).toBe('normal');
  });

  it('getRegionalExam: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.getRegionalExam(1);
    expect(result).toBeNull();
  });

  it('getRegionalExam: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.getRegionalExam(1)).rejects.toThrow('fail');
  });

  it('updateRegionalExam: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.updateRegionalExam({ idHistory: 1 });
    expect(result).toBe(true);
  });

  it('updateRegionalExam: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.updateRegionalExam({ idHistory: 1 })).rejects.toThrow(
      'fail'
    );
  });

  it('getExamBoca: con resultado', async () => {
    pool.query = vi
      .fn()
      .mockResolvedValue({ rows: [{ labios_sin_lesiones: true }] });
    const result = await HcModel.getExamBoca(1);
    expect(result.labiosSin).toBe(true);
  });

  it('getExamBoca: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.getExamBoca(1);
    expect(result).toBeNull();
  });

  it('getExamBoca: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.getExamBoca(1)).rejects.toThrow('fail');
  });

  it('updateExamBoca: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.updateExamBoca({ idHistory: 1 });
    expect(result).toBe(true);
  });

  it('updateExamBoca: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.updateExamBoca({ idHistory: 1 })).rejects.toThrow(
      'fail'
    );
  });

  it('getHigieneOral: con resultado', async () => {
    pool.query = vi
      .fn()
      .mockResolvedValue({ rows: [{ estado_higiene: 'buena' }] });
    const result = await HcModel.getHigieneOral(1);
    expect(result.estadoHigiene).toBe('buena');
  });

  it('getHigieneOral: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.getHigieneOral(1);
    expect(result).toBeNull();
  });

  it('getHigieneOral: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.getHigieneOral(1)).rejects.toThrow('fail');
  });

  it('updateHigieneOral: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.updateHigieneOral({
      idHistory: 1,
      estadoHigiene: 'buena',
      idUsuario: 2,
    });
    expect(result).toBe(true);
  });

  it('updateHigieneOral: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      HcModel.updateHigieneOral({
        idHistory: 1,
        estadoHigiene: 'buena',
        idUsuario: 2,
      })
    ).rejects.toThrow('fail');
  });

  it('getDiagnosticoPresuntivo: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ descripcion: 'desc' }] });
    const result = await HcModel.getDiagnosticoPresuntivo(1);
    expect(result.descripcion).toBe('desc');
  });

  it('getDiagnosticoPresuntivo: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.getDiagnosticoPresuntivo(1);
    expect(result.descripcion).toBe('');
  });

  it('getDiagnosticoPresuntivo: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.getDiagnosticoPresuntivo(1)).rejects.toThrow('fail');
  });

  it('updateDiagnosticoPresuntivo: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.updateDiagnosticoPresuntivo({
      idHistory: 1,
      descripcion: 'desc',
      idUsuario: 2,
    });
    expect(result).toBe(true);
  });

  it('updateDiagnosticoPresuntivo: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      HcModel.updateDiagnosticoPresuntivo({
        idHistory: 1,
        descripcion: 'desc',
        idUsuario: 2,
      })
    ).rejects.toThrow('fail');
  });

  it('getDerivacion: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({
      rows: [
        {
          destinos: {},
          observaciones: 'obs',
          fecha_derivacion: '2025-01-01',
          alumno_diagnostico: 'al',
          docente: 'doc',
        },
      ],
    });
    const result = await HcModel.getDerivacion(1);
    expect(result.observaciones).toBe('obs');
  });

  it('getDerivacion: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.getDerivacion(1);
    expect(result).toBeNull();
  });

  it('getDerivacion: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.getDerivacion(1)).rejects.toThrow('fail');
  });

  it('updateDerivacion: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.updateDerivacion({
      idHistory: 1,
      destinos: {},
      observaciones: 'obs',
      alumno: 'al',
      docente: 'doc',
      idUsuario: 2,
    });
    expect(result).toBe(true);
  });

  it('updateDerivacion: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      HcModel.updateDerivacion({
        idHistory: 1,
        destinos: {},
        observaciones: 'obs',
        alumno: 'al',
        docente: 'doc',
        idUsuario: 2,
      })
    ).rejects.toThrow('fail');
  });

  it('getDiagnosticoClinicas: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({
      rows: [{ fecha: '2025-01-01', clinica_respuesta: 'resp' }],
    });
    const result = await HcModel.getDiagnosticoClinicas(1);
    expect(result.fecha).toBe('2025-01-01');
  });

  it('getDiagnosticoClinicas: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await HcModel.getDiagnosticoClinicas(1);
    expect(result).toEqual({});
  });

  it('getDiagnosticoClinicas: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.getDiagnosticoClinicas(1)).rejects.toThrow('fail');
  });

  it('updateDiagnosticoClinicas: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.updateDiagnosticoClinicas({
      idHistory: 1,
      data: {},
      idUsuario: 2,
    });
    expect(result).toBe(true);
  });

  it('updateDiagnosticoClinicas: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      HcModel.updateDiagnosticoClinicas({
        idHistory: 1,
        data: {},
        idUsuario: 2,
      })
    ).rejects.toThrow('fail');
  });

  it('getEvolucion: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_evolucion: 1 }] });
    const result = await HcModel.getEvolucion(1);
    expect(result).toEqual([{ id_evolucion: 1 }]);
  });

  it('getEvolucion: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(HcModel.getEvolucion(1)).rejects.toThrow('fail');
  });

  it('addEvolucion: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    const result = await HcModel.addEvolucion({
      idHistory: 1,
      fecha: '2025-01-01',
      actividad: 'act',
      alumno: 'al',
      idUsuario: 2,
    });
    expect(result).toBe(true);
  });

  it('addEvolucion: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(
      HcModel.addEvolucion({
        idHistory: 1,
        fecha: '2025-01-01',
        actividad: 'act',
        alumno: 'al',
        idUsuario: 2,
      })
    ).rejects.toThrow('fail');
  });
});
