import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as controller from '../controllers/hc/examenFisico/examenRegionalController.js';
import ExamenRegional from '../models/hc/examenFisico/examenRegionalModel.js';
import { examenRegionalService } from '../controllers/hc/examenFisico/examenRegionalController.js';

const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('examenRegionalController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createExamenRegional - success', async () => {
    vi.spyOn(examenRegionalService, 'create').mockResolvedValue({ id: 1 });
    const req = mockReq({ campo: 'valor' });
    const res = mockRes();
    await controller.createExamenRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('createExamenRegional - error', async () => {
    vi.spyOn(examenRegionalService, 'create').mockRejectedValue(
      new Error('fail')
    );
    const req = mockReq({ campo: 'valor' });
    const res = mockRes();
    await controller.createExamenRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });

  it('getExamenRegional - found', async () => {
    vi.spyOn(ExamenRegional, 'getByHistoria').mockResolvedValue({ id: 1 });
    const req = mockReq({}, { id_historia: 1 });
    const res = mockRes();
    await controller.getExamenRegional(req, res);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('getExamenRegional - not found', async () => {
    vi.spyOn(ExamenRegional, 'getByHistoria').mockResolvedValue(null);
    const req = mockReq({}, { id_historia: 1 });
    const res = mockRes();
    await controller.getExamenRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No encontrado' });
  });

  it('getExamenRegional - error', async () => {
    vi.spyOn(ExamenRegional, 'getByHistoria').mockRejectedValue(
      new Error('fail')
    );
    const req = mockReq({}, { id_historia: 1 });
    const res = mockRes();
    await controller.getExamenRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });

  it('updateExamenRegional - found', async () => {
    vi.spyOn(ExamenRegional, 'getByHistoria').mockResolvedValue({
      id_regional: 2,
    });
    vi.spyOn(examenRegionalService, 'update').mockResolvedValue({ ok: true });
    const req = mockReq({ campo: 'valor' }, { id_historia: 1 });
    const res = mockRes();
    await controller.updateExamenRegional(req, res);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('updateExamenRegional - not found', async () => {
    vi.spyOn(ExamenRegional, 'getByHistoria').mockResolvedValue(null);
    const req = mockReq({ campo: 'valor' }, { id_historia: 1 });
    const res = mockRes();
    await controller.updateExamenRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No encontrado' });
  });

  it('updateExamenRegional - error', async () => {
    vi.spyOn(ExamenRegional, 'getByHistoria').mockRejectedValue(
      new Error('fail')
    );
    const req = mockReq({ campo: 'valor' }, { id_historia: 1 });
    const res = mockRes();
    await controller.updateExamenRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });
});
