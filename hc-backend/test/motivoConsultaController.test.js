import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the modules
vi.mock('../services/baseService.js');
vi.mock('../models/hc/anamnesis/motivoConsultaModel.js');

import * as controller from '../controllers/hc/anamnesis/motivoConsultaController.js';
import BaseService from '../services/baseService.js';
import MotivoConsulta from '../models/hc/anamnesis/motivoConsultaModel.js';

describe('MotivoConsulta Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.mocked(BaseService.prototype.create).mockReset();
    vi.mocked(BaseService.prototype.update).mockReset();
    vi.mocked(MotivoConsulta.getByHistoria).mockReset();
  });

  describe('createMotivoConsulta', () => {
    it('should return 201 on success', async () => {
      vi.mocked(BaseService.prototype.create).mockResolvedValue(true);
      await controller.createMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Motivo de consulta registrado con éxito',
      });
    });
    it('should return 400 if not created', async () => {
      vi.mocked(BaseService.prototype.create).mockResolvedValue(false);
      await controller.createMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudo registrar el motivo de consulta',
      });
    });
    it('should handle errors', async () => {
      vi.mocked(BaseService.prototype.create).mockRejectedValue(
        new Error('fail')
      );
      await controller.createMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'fail',
      });
    });
  });

  describe('getMotivoConsulta', () => {
    it('should return 200 and data if found', async () => {
      req.params.id_historia = '1';
      const mockData = { id: 1, motivo: 'Test' };
      vi.mocked(MotivoConsulta.getByHistoria).mockResolvedValue(mockData);
      await controller.getMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Motivo de consulta obtenido correctamente',
        data: mockData,
      });
    });
    it('should return 404 if not found', async () => {
      req.params.id_historia = '1';
      vi.mocked(MotivoConsulta.getByHistoria).mockResolvedValue(null);
      await controller.getMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'No se encontró motivo de consulta para la historia clínica indicada',
      });
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.mocked(MotivoConsulta.getByHistoria).mockRejectedValue(
        new Error('fail')
      );
      await controller.getMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener el motivo de consulta',
      });
    });
  });

  describe('updateMotivoConsulta', () => {
    it('should return 200 on success', async () => {
      req.params.id_historia = '1';
      vi.mocked(MotivoConsulta.getByHistoria).mockResolvedValue({ id: 1 });
      vi.mocked(BaseService.prototype.update).mockResolvedValue(true);
      await controller.updateMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Motivo de consulta actualizado correctamente',
      });
    });
    it('should return 404 if motivo not found', async () => {
      req.params.id_historia = '1';
      vi.mocked(MotivoConsulta.getByHistoria).mockResolvedValue(null);
      await controller.updateMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error:
          'No se encontró motivo de consulta para la historia clínica indicada',
      });
    });
    it('should return 500 if not updated', async () => {
      req.params.id_historia = '1';
      vi.mocked(MotivoConsulta.getByHistoria).mockResolvedValue({ id: 1 });
      vi.mocked(BaseService.prototype.update).mockResolvedValue(false);
      await controller.updateMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudo actualizar el motivo de consulta',
      });
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.mocked(MotivoConsulta.getByHistoria).mockRejectedValue(
        new Error('fail')
      );
      await controller.updateMotivoConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'fail',
      });
    });
  });
});
