import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as controller from '../controllers/hc/examenFisico/examenGeneralController.js';
import ExamenGeneral from '../models/hc/examenFisico/examenGeneralModel.js';
import { examenGeneralService } from '../controllers/hc/examenFisico/examenGeneralController.js';

const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('examenGeneralController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createExamenGeneral - success', async () => {
    vi.spyOn(examenGeneralService, 'create').mockResolvedValue({ id: 1 });
    const req = mockReq({ campo: 'valor' });
    const res = mockRes();
    await controller.createExamenGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('createExamenGeneral - error', async () => {
    vi.spyOn(examenGeneralService, 'create').mockRejectedValue(
      new Error('fail')
    );
    const req = mockReq({ campo: 'valor' });
    const res = mockRes();
    await controller.createExamenGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });

  it('getExamenGeneral - found', async () => {
    vi.spyOn(ExamenGeneral, 'getByHistoria').mockResolvedValue({ id: 1 });
    const req = mockReq({}, { id_historia: 1 });
    const res = mockRes();
    await controller.getExamenGeneral(req, res);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('getExamenGeneral - not found', async () => {
    vi.spyOn(ExamenGeneral, 'getByHistoria').mockResolvedValue(null);
    const req = mockReq({}, { id_historia: 1 });
    const res = mockRes();
    await controller.getExamenGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No encontrado' });
  });

  it('getExamenGeneral - error', async () => {
    vi.spyOn(ExamenGeneral, 'getByHistoria').mockRejectedValue(
      new Error('fail')
    );
    const req = mockReq({}, { id_historia: 1 });
    const res = mockRes();
    await controller.getExamenGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });

  it('updateExamenGeneral - found', async () => {
    vi.spyOn(ExamenGeneral, 'getByHistoria').mockResolvedValue({
      id_examen: 2,
    });
    vi.spyOn(examenGeneralService, 'update').mockResolvedValue({ ok: true });
    const req = mockReq({ campo: 'valor' }, { id_historia: 1 });
    const res = mockRes();
    await controller.updateExamenGeneral(req, res);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('updateExamenGeneral - not found', async () => {
    vi.spyOn(ExamenGeneral, 'getByHistoria').mockResolvedValue(null);
    const req = mockReq({ campo: 'valor' }, { id_historia: 1 });
    const res = mockRes();
    await controller.updateExamenGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No encontrado' });
  });

  it('updateExamenGeneral - error', async () => {
    vi.spyOn(ExamenGeneral, 'getByHistoria').mockRejectedValue(
      new Error('fail')
    );
    const req = mockReq({ campo: 'valor' }, { id_historia: 1 });
    const res = mockRes();
    await controller.updateExamenGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });
});
