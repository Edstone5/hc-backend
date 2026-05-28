import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCatalogoController,
  getCatalogoNombrePorIdController,
} from '../controllers/catologo/catalogoControllers.js';

describe('Catalogo Controllers', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('getCatalogoController', () => {
    it('should return 200 and catalog data when found', async () => {
      req.params.nombre = 'testCatalog';
      const mockData = [{ id: 1, nombre: 'item' }];

      // mock function
      vi.spyOn(
        await import('../models/catalogo/catalogoModels.js'),
        'getCatalogo'
      ).mockResolvedValue(mockData);

      await getCatalogoController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Catalog data retrieved successfully',
        data: mockData,
      });
    });

    it('should return 404 if no data found', async () => {
      req.params.nombre = 'emptyCatalog';

      vi.spyOn(
        await import('../models/catalogo/catalogoModels.js'),
        'getCatalogo'
      ).mockResolvedValue([]);

      await getCatalogoController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No data found for this catalog',
      });
    });

    it('should return 400 on error', async () => {
      req.params.nombre = 'errorCatalog';

      vi.spyOn(
        await import('../models/catalogo/catalogoModels.js'),
        'getCatalogo'
      ).mockRejectedValue(new Error('Test error'));

      await getCatalogoController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Test error' });
    });
  });

  describe('getCatalogoNombrePorIdController', () => {
    it('should return 200 and catalog name when found', async () => {
      req.params.nombre = 'testCatalog';
      req.params.id = '1';

      vi.spyOn(
        await import('../models/catalogo/catalogoModels.js'),
        'getCatalogoNombrePorId'
      ).mockResolvedValue('itemName');

      await getCatalogoNombrePorIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Catalog name retrieved successfully',
        id: '1',
        nombre: 'itemName',
      });
    });

    it('should return 404 if no name found', async () => {
      req.params.nombre = 'testCatalog';
      req.params.id = '2';

      vi.spyOn(
        await import('../models/catalogo/catalogoModels.js'),
        'getCatalogoNombrePorId'
      ).mockResolvedValue(null);

      await getCatalogoNombrePorIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No data found for this id in catalog',
      });
    });

    it('should return 400 on error', async () => {
      req.params.nombre = 'testCatalog';
      req.params.id = '3';

      vi.spyOn(
        await import('../models/catalogo/catalogoModels.js'),
        'getCatalogoNombrePorId'
      ).mockRejectedValue(new Error('Test error'));

      await getCatalogoNombrePorIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Test error' });
    });
  });
});
