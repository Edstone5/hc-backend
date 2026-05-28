import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentController } from '../controllers/students/studentController.js';

describe('StudentController', () => {
  let req, res, studentModel, controller;

  beforeEach(() => {
    studentModel = {
      getAdultPatientsByStudentId: vi.fn(),
      registerPatient: vi.fn(),
    };
    controller = new StudentController(studentModel);
    req = { body: {}, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('getAdultPatientsByStudentId', () => {
    it('should return 400 if id is invalid', async () => {
      req.params.id = 'shortid';
      await controller.getAdultPatientsByStudentId(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('UUID'),
      });
    });
    it('should return 200 and patients array', async () => {
      req.params.id = '12345678-1234-1234-1234-123456789012';
      const patients = [{ id: 1 }];
      studentModel.getAdultPatientsByStudentId.mockResolvedValue(patients);
      await controller.getAdultPatientsByStudentId(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(patients);
    });
  });

  describe('registerPatient', () => {
    it('should return 400 if studentId is invalid', async () => {
      req.params.studentId = 'shortid';
      await controller.registerPatient(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('UUID'),
      });
    });
    it('should return 400 if nombreCompleto is missing', async () => {
      req.params.studentId = '12345678-1234-1234-1234-123456789012';
      req.body = { edad: 20 };
      await controller.registerPatient(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('nombre completo'),
      });
    });
    it('should return 201 and new patient on success', async () => {
      req.params.studentId = '12345678-1234-1234-1234-123456789012';
      req.body = { nombreCompleto: 'Ana', edad: 20 };
      const newPatient = { id: 1, nombreCompleto: 'Ana' };
      studentModel.registerPatient.mockResolvedValue(newPatient);
      await controller.registerPatient(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newPatient);
    });
  });
});
