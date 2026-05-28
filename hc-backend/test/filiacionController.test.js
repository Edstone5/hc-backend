import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock the modules
vi.mock('../services/baseService.js');
vi.mock('../models/hc/anamnesis/filiacionModel.js');

// 2. Import the controller and the mocked dependencies
import * as controller from '../controllers/hc/anamnesis/filiacionController.js';
import BaseService from '../services/baseService.js';
import Filiacion from '../models/hc/anamnesis/filiacionModel.js';

describe('Filiacion Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    // 3. Reset mocks
    vi.mocked(BaseService.prototype.create).mockReset();
    vi.mocked(BaseService.prototype.update).mockReset();
    vi.mocked(Filiacion.getByHistoria).mockReset();
  });

  describe('createFiliacion', () => {
    it('should return 201 on success', async () => {
      vi.mocked(BaseService.prototype.create).mockResolvedValue(true);
      await controller.createFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Filiación registrada con éxito',
      });
    });

    it('should return 400 if not created', async () => {
      vi.mocked(BaseService.prototype.create).mockResolvedValue(false);
      await controller.createFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No se pudo registrar la filiación',
      });
    });

    it('should handle errors', async () => {
      vi.mocked(BaseService.prototype.create).mockRejectedValue(
        new Error('DB error')
      );
      await controller.createFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'DB error',
      });
    });
  });

  describe('getFiliacion', () => {
    it('should return 200 and data if found', async () => {
      req.params.id_historia = '1';
      const mockData = { id: 1, nombre: 'Test' };
      vi.mocked(Filiacion.getByHistoria).mockResolvedValue(mockData);
      await controller.getFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Filiación obtenida correctamente',
        data: mockData,
      });
    });

    it('should return 404 if not found', async () => {
      req.params.id_historia = '1';
      vi.mocked(Filiacion.getByHistoria).mockResolvedValue(null);
      await controller.getFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.mocked(Filiacion.getByHistoria).mockRejectedValue(
        new Error('DB error')
      );
      await controller.getFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateFiliacion', () => {
    it('should return 200 on success', async () => {
      req.params.id_historia = '1';
      vi.mocked(Filiacion.getByHistoria).mockResolvedValue({ id: 1 });
      vi.mocked(BaseService.prototype.update).mockResolvedValue(true);
      await controller.updateFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Filiación actualizada correctamente',
      });
    });

    it('should return 404 if filiacion not found', async () => {
      req.params.id_historia = '1';
      vi.mocked(Filiacion.getByHistoria).mockResolvedValue(null);
      await controller.updateFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 if not updated', async () => {
      req.params.id_historia = '1';
      vi.mocked(Filiacion.getByHistoria).mockResolvedValue({ id: 1 });
      vi.mocked(BaseService.prototype.update).mockResolvedValue(false);
      await controller.updateFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.mocked(Filiacion.getByHistoria).mockRejectedValue(
        new Error('DB error')
      );
      await controller.updateFiliacion(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
