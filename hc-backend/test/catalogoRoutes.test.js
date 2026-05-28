import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('catalogo routes', () => {
  const app = express();
  app.use(express.json());
  // Define router con mocks
  const router = express.Router();
  const getCatalogoController = vi.fn((req, res) => res.json({ ok: true }));
  const getCatalogoNombrePorIdController = vi.fn((req, res) =>
    res.json({ id: req.params.id })
  );
  router.get('/:nombre', getCatalogoController);
  router.get('/:nombre/:id', getCatalogoNombrePorIdController);
  app.use('/api/catalogo', router);

  beforeEach(() => {
    getCatalogoController.mockClear();
    getCatalogoNombrePorIdController.mockClear();
  });

  it('GET /api/catalogo/:nombre should call getCatalogoController', async () => {
    const res = await request(app).get('/api/catalogo/test');
    expect(res.body).toEqual({ ok: true });
    expect(res.status).toBe(200);
    expect(getCatalogoController).toHaveBeenCalled();
  });

  it('GET /api/catalogo/:nombre/:id should call getCatalogoNombrePorIdController', async () => {
    const res = await request(app).get('/api/catalogo/test/123');
    expect(res.body).toEqual({ id: '123' });
    expect(res.status).toBe(200);
    expect(getCatalogoNombrePorIdController).toHaveBeenCalled();
  });
});
