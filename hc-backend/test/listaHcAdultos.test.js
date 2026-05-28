import { describe, it, expect, vi, afterEach } from 'vitest';
import { listaHcAdultos } from '../controllers/hc/hcController/listaHcAdultos.js';
import * as hcModel from '../models/hc/hcModels/listaHcAdultos.js';

describe('listaHcAdultos', () => {
  const req = { params: { id: '1' } };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };

  afterEach(() => {
    vi.restoreAllMocks();
    res.status.mockClear();
    res.json.mockClear();
  });

  it('debería devolver historias encontradas', async () => {
    vi.spyOn(hcModel, 'getAdultHistoriasByStudent').mockResolvedValue([
      { id: 1 },
    ]);
    await listaHcAdultos(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('debería devolver 404 si no hay historias', async () => {
    vi.spyOn(hcModel, 'getAdultHistoriasByStudent').mockResolvedValue([]);
    await listaHcAdultos(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No se encontraron historias clínicas adultas.',
    });
  });

  it('debería devolver 500 si ocurre un error', async () => {
    vi.spyOn(hcModel, 'getAdultHistoriasByStudent').mockRejectedValue(
      new Error('Error de DB')
    );
    await listaHcAdultos(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error de DB' });
  });
});
