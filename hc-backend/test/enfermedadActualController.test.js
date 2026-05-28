import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock the modules without factories to let Vitest auto-mock them.
vi.mock('../services/baseService.js');
vi.mock('../models/hc/anamnesis/enfermedadActualModel.js');

// 2. Import the controller and the (now mocked) dependencies.
import * as controller from '../controllers/hc/anamnesis/enfermedadActualController.js';
import BaseService from '../services/baseService.js';
import EnfermedadActual from '../models/hc/anamnesis/enfermedadActualModel.js';

describe('EnfermedadActual Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    // 3. Reset mocks using the vi.mocked helper.
    vi.mocked(BaseService.prototype.create).mockReset();
    vi.mocked(BaseService.prototype.update).mockReset();
    vi.mocked(EnfermedadActual.getByHistoria).mockReset();
  });

  describe('createEnfermedadActual', () => {
    it('should return 201 on success', async () => {
      const mockData = { id: 1 };
      // 4. Configure the mock for this specific test.
      vi.mocked(BaseService.prototype.create).mockResolvedValue(mockData);

      await controller.createEnfermedadActual(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('registrada'),
        data: mockData,
      });
    });

    it('should return 500 if not created', async () => {
      vi.mocked(BaseService.prototype.create).mockResolvedValue(null);
      await controller.createEnfermedadActual(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors', async () => {
      vi.mocked(BaseService.prototype.create).mockRejectedValue(
        new Error('fail')
      );
      await controller.createEnfermedadActual(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEnfermedadActual', () => {
    it('should return 200 if found', async () => {
      req.params.id_historia = '1';
      const mockData = { id: 1 };
      vi.mocked(EnfermedadActual.getByHistoria).mockResolvedValue(mockData);

      await controller.getEnfermedadActual(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('obtenida'),
        data: mockData,
      });
    });

    it('should return 404 if not found', async () => {
      req.params.id_historia = '1';
      vi.mocked(EnfermedadActual.getByHistoria).mockResolvedValue(null);
      await controller.getEnfermedadActual(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.mocked(EnfermedadActual.getByHistoria).mockRejectedValue(
        new Error('fail')
      );
      await controller.getEnfermedadActual(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateEnfermedadActual', () => {
    it('should return 200 on success', async () => {
      req.params.id_historia = '1';
      const mockData = { id: 1 };
      vi.mocked(EnfermedadActual.getByHistoria).mockResolvedValue(mockData);
      vi.mocked(BaseService.prototype.update).mockResolvedValue(mockData);

      await controller.updateEnfermedadActual(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('actualizada'),
        data: mockData,
      });
    });

    it('should return 404 if not found', async () => {
      req.params.id_historia = '1';
      vi.mocked(EnfermedadActual.getByHistoria).mockResolvedValue(null);
      await controller.updateEnfermedadActual(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 if not updated', async () => {
      req.params.id_historia = '1';
      vi.mocked(EnfermedadActual.getByHistoria).mockResolvedValue({ id: 1 });
      vi.mocked(BaseService.prototype.update).mockResolvedValue(null);
      await controller.updateEnfermedadActual(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.mocked(EnfermedadActual.getByHistoria).mockRejectedValue(
        new Error('fail')
      );
      await controller.updateEnfermedadActual(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
