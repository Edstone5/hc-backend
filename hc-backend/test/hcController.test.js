import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HcController } from '../controllers/hc/hcController.js';

describe('HcController', () => {
  let req, res, hcModel, controller;

  beforeEach(() => {
    hcModel = {
      createReview: vi.fn(),
      getAllByStudentId: vi.fn(),
      getFiliationByIdHistory: vi.fn(),
      registerHc: vi.fn(),
      createDraft: vi.fn(),
      assignPatient: vi.fn(),
      getPatientByHistory: vi.fn(),
      updateFiliation: vi.fn(),
      getGeneralExam: vi.fn(),
      updateGeneralExam: vi.fn(),
      getRegionalExam: vi.fn(),
      updateRegionalExam: vi.fn(),
      getExamBoca: vi.fn(),
      updateExamBoca: vi.fn(),
      getHigieneOral: vi.fn(),
      updateHigieneOral: vi.fn(),
      getDiagnosticoPresuntivo: vi.fn(),
      updateDiagnosticoPresuntivo: vi.fn(),
      getDerivacion: vi.fn(),
      updateDerivacion: vi.fn(),
      getDiagnosticoClinicas: vi.fn(),
      updateDiagnosticoClinicas: vi.fn(),
      getEvolucion: vi.fn(),
      addEvolucion: vi.fn(),
    };
    controller = new HcController(hcModel);
    req = { body: {}, params: {}, user: { id: 1 } };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('createReview success', async () => {
    hcModel.createReview.mockResolvedValue(true);
    req.body = { idHistory: 1, idTeacher: 2, state: 'ok', observations: 'obs' };
    await controller.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
  it('createReview error', async () => {
    hcModel.createReview.mockResolvedValue(false);
    await controller.createReview(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getAllByStudentId success', async () => {
    hcModel.getAllByStudentId.mockResolvedValue(['a']);
    req.params.id = '1';
    await controller.getAllByStudentId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(['a']);
  });
  it('getAllByStudentId error', async () => {
    hcModel.getAllByStudentId.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getAllByStudentId(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getFiliationByIdHistory found', async () => {
    hcModel.getFiliationByIdHistory.mockResolvedValue({ id: 1 });
    req.params.id = '1';
    await controller.getFiliationByIdHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('getFiliationByIdHistory not found', async () => {
    hcModel.getFiliationByIdHistory.mockResolvedValue(null);
    req.params.id = '1';
    await controller.getFiliationByIdHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('registerHc success', async () => {
    hcModel.registerHc.mockResolvedValue({ id: 1 });
    req.body.idStudent = 1;
    await controller.registerHc(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
  it('registerHc error', async () => {
    hcModel.registerHc.mockResolvedValue(null);
    await controller.registerHc(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('createDraft success', async () => {
    hcModel.createDraft.mockResolvedValue({ id_historia: 1 });
    await controller.createDraft(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('createDraft error', async () => {
    hcModel.createDraft.mockRejectedValue(new Error('fail'));
    await controller.createDraft(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('assignPatient success', async () => {
    hcModel.assignPatient.mockResolvedValue();
    req.body = { idHistory: 1, idPatient: 2 };
    await controller.assignPatient(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('assignPatient validation error', async () => {
    hcModel.assignPatient.mockRejectedValue(new Error('no encontrada'));
    await controller.assignPatient(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it('assignPatient server error', async () => {
    hcModel.assignPatient.mockRejectedValue(new Error('fail'));
    await controller.assignPatient(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getPatientByHistory found', async () => {
    hcModel.getPatientByHistory.mockResolvedValue({ id: 1 });
    req.params.id = '1';
    await controller.getPatientByHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('getPatientByHistory not found', async () => {
    hcModel.getPatientByHistory.mockResolvedValue(null);
    req.params.id = '1';
    await controller.getPatientByHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it('getPatientByHistory error', async () => {
    hcModel.getPatientByHistory.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getPatientByHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('updateFiliation success', async () => {
    hcModel.updateFiliation.mockResolvedValue();
    req.params.id = '1';
    req.body = { nombre: 'a' };
    await controller.updateFiliation(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('updateFiliation validation error', async () => {
    hcModel.updateFiliation.mockRejectedValue(new Error('no encontrado'));
    req.params.id = '1';
    await controller.updateFiliation(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it('updateFiliation server error', async () => {
    hcModel.updateFiliation.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.updateFiliation(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- MÉTODOS EXAMEN GENERAL ---
  it('getGeneralExam success', async () => {
    hcModel.getGeneralExam.mockResolvedValue({ foo: 'bar' });
    req.params.id = '1';
    await controller.getGeneralExam(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ foo: 'bar' });
  });
  it('getGeneralExam error', async () => {
    hcModel.getGeneralExam.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getGeneralExam(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it('updateGeneralExam success', async () => {
    hcModel.updateGeneralExam.mockResolvedValue();
    req.params.id = '1';
    req.body = { foo: 'bar' };
    await controller.updateGeneralExam(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('updateGeneralExam error', async () => {
    hcModel.updateGeneralExam.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    req.body = { foo: 'bar' };
    await controller.updateGeneralExam(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- MÉTODOS EXAMEN REGIONAL ---
  it('getRegionalExam success', async () => {
    hcModel.getRegionalExam.mockResolvedValue({ foo: 'bar' });
    req.params.id = '1';
    await controller.getRegionalExam(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ foo: 'bar' });
  });
  it('getRegionalExam error', async () => {
    hcModel.getRegionalExam.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getRegionalExam(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it('updateRegionalExam success', async () => {
    hcModel.updateRegionalExam.mockResolvedValue();
    req.params.id = '1';
    req.body = { foo: 'bar' };
    await controller.updateRegionalExam(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('updateRegionalExam error', async () => {
    hcModel.updateRegionalExam.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    req.body = { foo: 'bar' };
    await controller.updateRegionalExam(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- MÉTODOS EXAMEN BOCA ---
  it('getExamBoca success', async () => {
    hcModel.getExamBoca.mockResolvedValue({ foo: 'bar' });
    req.params.id = '1';
    await controller.getExamBoca(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ foo: 'bar' });
  });
  it('getExamBoca error', async () => {
    hcModel.getExamBoca.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getExamBoca(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it('updateExamBoca success', async () => {
    hcModel.updateExamBoca.mockResolvedValue();
    req.params.id = '1';
    req.body = { foo: 'bar' };
    await controller.updateExamBoca(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('updateExamBoca error', async () => {
    hcModel.updateExamBoca.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    req.body = { foo: 'bar' };
    await controller.updateExamBoca(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- HIGIENE BUCAL ---
  it('getHigieneOral success', async () => {
    hcModel.getHigieneOral.mockResolvedValue({ foo: 'bar' });
    req.params.id = '1';
    await controller.getHigieneOral(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ foo: 'bar' });
  });
  it('getHigieneOral error', async () => {
    hcModel.getHigieneOral.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getHigieneOral(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it('updateHigieneOral success', async () => {
    hcModel.updateHigieneOral.mockResolvedValue();
    req.params.id = '1';
    req.body = { estadoHigiene: 'ok' };
    req.user.id = 2;
    await controller.updateHigieneOral(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('updateHigieneOral error', async () => {
    hcModel.updateHigieneOral.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    req.body = { estadoHigiene: 'ok' };
    req.user.id = 2;
    await controller.updateHigieneOral(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- SECCIÓN III (PRESUNTIVO) ---
  it('getDiagnosticoPresuntivo success', async () => {
    hcModel.getDiagnosticoPresuntivo.mockResolvedValue({ foo: 'bar' });
    req.params.id = '1';
    await controller.getDiagnosticoPresuntivo(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ foo: 'bar' });
  });
  it('getDiagnosticoPresuntivo error', async () => {
    hcModel.getDiagnosticoPresuntivo.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getDiagnosticoPresuntivo(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it('updateDiagnosticoPresuntivo success', async () => {
    hcModel.updateDiagnosticoPresuntivo.mockResolvedValue();
    req.params.id = '1';
    req.body = { descripcion: 'desc' };
    req.user.id = 2;
    await controller.updateDiagnosticoPresuntivo(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('updateDiagnosticoPresuntivo error', async () => {
    hcModel.updateDiagnosticoPresuntivo.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    req.body = { descripcion: 'desc' };
    req.user.id = 2;
    await controller.updateDiagnosticoPresuntivo(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- SECCIÓN IV (DERIVACIÓN) ---
  it('getDerivacion success', async () => {
    hcModel.getDerivacion.mockResolvedValue({ foo: 'bar' });
    req.params.id = '1';
    await controller.getDerivacion(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ foo: 'bar' });
  });
  it('getDerivacion error', async () => {
    hcModel.getDerivacion.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getDerivacion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it('updateDerivacion success', async () => {
    hcModel.updateDerivacion.mockResolvedValue();
    req.params.id = '1';
    req.body = { destinos: [], observaciones: '', alumno: '', docente: '' };
    req.user.id = 2;
    await controller.updateDerivacion(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('updateDerivacion error', async () => {
    hcModel.updateDerivacion.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    req.body = { destinos: [], observaciones: '', alumno: '', docente: '' };
    req.user.id = 2;
    await controller.updateDerivacion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- SECCIÓN V (CLÍNICAS) ---
  it('getDiagnosticoClinicas success', async () => {
    hcModel.getDiagnosticoClinicas.mockResolvedValue({ foo: 'bar' });
    req.params.id = '1';
    await controller.getDiagnosticoClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ foo: 'bar' });
  });
  it('getDiagnosticoClinicas error', async () => {
    hcModel.getDiagnosticoClinicas.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getDiagnosticoClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it('updateDiagnosticoClinicas success', async () => {
    hcModel.updateDiagnosticoClinicas.mockResolvedValue();
    req.params.id = '1';
    req.body = { fecha: '2025-12-02', clinicaRespuesta: 'ok' };
    req.user.id = 2;
    await controller.updateDiagnosticoClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('updateDiagnosticoClinicas error', async () => {
    hcModel.updateDiagnosticoClinicas.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    req.body = { fecha: '2025-12-02', clinicaRespuesta: 'ok' };
    req.user.id = 2;
    await controller.updateDiagnosticoClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // --- SECCIÓN VI (EVOLUCIÓN) ---
  it('getEvolucion success', async () => {
    hcModel.getEvolucion.mockResolvedValue([{ id: 1 }]);
    req.params.id = '1';
    await controller.getEvolucion(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });
  it('getEvolucion error', async () => {
    hcModel.getEvolucion.mockRejectedValue(new Error('fail'));
    req.params.id = '1';
    await controller.getEvolucion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  it('addEvolucion success', async () => {
    req.params.id = '1';
    req.body = { fecha: '2025-12-02', actividad: 'act', alumno: 'al' };
    req.user.id = 2;
    hcModel.addEvolucion.mockResolvedValue();
    await controller.addEvolucion(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
  it('addEvolucion missing fields', async () => {
    req.params.id = '1';
    req.body = { fecha: '', actividad: '', alumno: '' };
    req.user.id = 2;
    await controller.addEvolucion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it('addEvolucion error', async () => {
    req.params.id = '1';
    req.body = { fecha: '2025-12-02', actividad: 'act', alumno: 'al' };
    req.user.id = 2;
    hcModel.addEvolucion.mockRejectedValue(new Error('fail'));
    await controller.addEvolucion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
