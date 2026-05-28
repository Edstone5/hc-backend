import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as controller from '../controllers/hc/anamnesis/antecedenteController.js';

describe('Antecedente Controller', () => {
  let req, res;
  let models;

  beforeEach(async () => {
    req = { params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    models = await import('../models/hc/anamnesis/antecedenteModel.js');
    vi.restoreAllMocks();
  });

  // --- Cumplimiento ---
  describe('createAntecedenteCumplimiento', () => {
    it('should return 201 on success', async () => {
      vi.spyOn(models.AntecedenteCumplimiento, 'create').mockResolvedValue(
        true
      );
      await controller.createAntecedenteCumplimiento(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('registrado'),
      });
    });
    it('should return 500 on failure', async () => {
      vi.spyOn(models.AntecedenteCumplimiento, 'create').mockResolvedValue(
        false
      );
      await controller.createAntecedenteCumplimiento(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
    it('should handle errors', async () => {
      vi.spyOn(models.AntecedenteCumplimiento, 'create').mockRejectedValue(
        new Error('fail')
      );
      await controller.createAntecedenteCumplimiento(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  describe('getAntecedenteCumplimiento', () => {
    it('should return 200 if found', async () => {
      req.params.id_historia = '1';
      vi.spyOn(
        models.AntecedenteCumplimiento,
        'getByHistoria'
      ).mockResolvedValue({});
      await controller.getAntecedenteCumplimiento(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('should return 404 if not found', async () => {
      req.params.id_historia = '1';
      vi.spyOn(
        models.AntecedenteCumplimiento,
        'getByHistoria'
      ).mockResolvedValue(null);
      await controller.getAntecedenteCumplimiento(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.spyOn(
        models.AntecedenteCumplimiento,
        'getByHistoria'
      ).mockRejectedValue(new Error('fail'));
      await controller.getAntecedenteCumplimiento(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  describe('updateAntecedenteCumplimiento', () => {
    it('should return 200 on success', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteCumplimiento, 'update').mockResolvedValue(
        true
      );
      await controller.updateAntecedenteCumplimiento(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('should return 500 on failure', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteCumplimiento, 'update').mockResolvedValue(
        false
      );
      await controller.updateAntecedenteCumplimiento(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteCumplimiento, 'update').mockRejectedValue(
        new Error('fail')
      );
      await controller.updateAntecedenteCumplimiento(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  // --- Familiar ---
  describe('createAntecedenteFamiliar', () => {
    it('should return 201 on success', async () => {
      vi.spyOn(models.AntecedenteFamiliar, 'create').mockResolvedValue(true);
      await controller.createAntecedenteFamiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it('should return 500 on failure', async () => {
      vi.spyOn(models.AntecedenteFamiliar, 'create').mockResolvedValue(false);
      await controller.createAntecedenteFamiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
    it('should handle errors', async () => {
      vi.spyOn(models.AntecedenteFamiliar, 'create').mockRejectedValue(
        new Error('fail')
      );
      await controller.createAntecedenteFamiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  describe('getAntecedenteFamiliar', () => {
    it('should return 200 if found', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteFamiliar, 'getByHistoria').mockResolvedValue(
        {}
      );
      await controller.getAntecedenteFamiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('should return 404 if not found', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteFamiliar, 'getByHistoria').mockResolvedValue(
        null
      );
      await controller.getAntecedenteFamiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteFamiliar, 'getByHistoria').mockRejectedValue(
        new Error('fail')
      );
      await controller.getAntecedenteFamiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  describe('updateAntecedenteFamiliar', () => {
    it('should return 200 on success', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteFamiliar, 'update').mockResolvedValue(true);
      await controller.updateAntecedenteFamiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('should return 500 on failure', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteFamiliar, 'update').mockResolvedValue(false);
      await controller.updateAntecedenteFamiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteFamiliar, 'update').mockRejectedValue(
        new Error('fail')
      );
      await controller.updateAntecedenteFamiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  // --- Personal ---
  describe('createAntecedentePersonal', () => {
    it('should return 201 on success', async () => {
      vi.spyOn(models.AntecedentePersonal, 'create').mockResolvedValue(true);
      await controller.createAntecedentePersonal(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it('should return 500 on failure', async () => {
      vi.spyOn(models.AntecedentePersonal, 'create').mockResolvedValue(false);
      await controller.createAntecedentePersonal(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
    it('should handle errors', async () => {
      vi.spyOn(models.AntecedentePersonal, 'create').mockRejectedValue(
        new Error('fail')
      );
      await controller.createAntecedentePersonal(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  describe('getAntecedentePersonal', () => {
    it('should return 200 if found', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedentePersonal, 'getByHistoria').mockResolvedValue(
        {}
      );
      await controller.getAntecedentePersonal(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('should return 404 if not found', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedentePersonal, 'getByHistoria').mockResolvedValue(
        null
      );
      await controller.getAntecedentePersonal(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedentePersonal, 'getByHistoria').mockRejectedValue(
        new Error('fail')
      );
      await controller.getAntecedentePersonal(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  describe('updateAntecedentePersonal', () => {
    it('should return 200 on success', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedentePersonal, 'update').mockResolvedValue(true);
      await controller.updateAntecedentePersonal(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('should return 500 on failure', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedentePersonal, 'update').mockResolvedValue(false);
      await controller.updateAntecedentePersonal(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedentePersonal, 'update').mockRejectedValue(
        new Error('fail')
      );
      await controller.updateAntecedentePersonal(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  // --- Médico ---
  describe('createAntecedenteMedico', () => {
    it('should return 201 on success', async () => {
      vi.spyOn(models.AntecedenteMedico, 'create').mockResolvedValue(true);
      await controller.createAntecedenteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it('should return 500 on failure', async () => {
      vi.spyOn(models.AntecedenteMedico, 'create').mockResolvedValue(false);
      await controller.createAntecedenteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
    it('should handle errors', async () => {
      vi.spyOn(models.AntecedenteMedico, 'create').mockRejectedValue(
        new Error('fail')
      );
      await controller.createAntecedenteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  describe('getAntecedenteMedico', () => {
    it('should return 200 if found', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteMedico, 'getByHistoria').mockResolvedValue({});
      await controller.getAntecedenteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('should return 404 if not found', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteMedico, 'getByHistoria').mockResolvedValue(
        null
      );
      await controller.getAntecedenteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteMedico, 'getByHistoria').mockRejectedValue(
        new Error('fail')
      );
      await controller.getAntecedenteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });

  describe('updateAntecedenteMedico', () => {
    it('should return 200 on success', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteMedico, 'update').mockResolvedValue(true);
      await controller.updateAntecedenteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('should return 500 on failure', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteMedico, 'update').mockResolvedValue(false);
      await controller.updateAntecedenteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
    it('should handle errors', async () => {
      req.params.id_historia = '1';
      vi.spyOn(models.AntecedenteMedico, 'update').mockRejectedValue(
        new Error('fail')
      );
      await controller.updateAntecedenteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
    });
  });
});
