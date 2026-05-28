import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientController } from '../controllers/patients/patientController.js';

describe('PatientController', () => {
  let req, res, patientModel, controller;

  beforeEach(() => {
    patientModel = {
      createPatient: vi.fn(),
      updatePatient: vi.fn(),
    };
    controller = new PatientController(patientModel);
    req = { body: {}, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('createPatient', () => {
    it('should return 400 if missing nombre or apellido', async () => {
      req.body = { apellido: 'Doe' };
      await controller.createPatient(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('nombre'),
      });
    });
    it('should return 201 and id on success', async () => {
      req.body = { nombre: 'John', apellido: 'Doe' };
      patientModel.createPatient.mockResolvedValue({ id: '123' });
      await controller.createPatient(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: '123' });
    });
    it('should return 409 if patient already exists', async () => {
      req.body = { nombre: 'John', apellido: 'Doe' };
      patientModel.createPatient.mockRejectedValue(
        new Error('Ya existe un paciente')
      );
      await controller.createPatient(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('DNI'),
      });
    });
    it('should return 500 on other errors', async () => {
      req.body = { nombre: 'John', apellido: 'Doe' };
      patientModel.createPatient.mockRejectedValue(new Error('fail'));
      await controller.createPatient(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al crear paciente.',
      });
    });
  });

  describe('updatePatient', () => {
    it('should return 400 if id is invalid', async () => {
      req.params.id = 'shortid';
      await controller.updatePatient(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should return 200 on success', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      req.body = { nombre: 'Jane', apellido: 'Smith' };
      patientModel.updatePatient.mockResolvedValue();
      await controller.updatePatient(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('actualizados'),
      });
    });
    it('should return 404 if patient not found', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      patientModel.updatePatient.mockRejectedValue(
        new Error('No existe un paciente')
      );
      await controller.updatePatient(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Paciente no encontrado',
      });
    });
    it('should return 500 on other errors', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      patientModel.updatePatient.mockRejectedValue(new Error('fail'));
      await controller.updatePatient(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno al actualizar el paciente.',
      });
    });
  });
});
