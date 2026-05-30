/**
 * Tests for examenBoca/application/examenBocaController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExamenBocaRepo = vi.hoisted(() => ({
  getByHistoria: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../examenBoca/infrastructure/examenBocaRepository.js', () => ({
  default: mockExamenBocaRepo,
}));

import { ExamenBocaController } from '../examenBoca/application/examenBocaController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('ExamenBocaController.consultarExamenBucal', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {} };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockExamenBocaRepo.getByHistoria.mockResolvedValue({ labios: 'normal' });
    await ExamenBocaController.consultarExamenBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ labios: 'normal' });
  });

  it('returns 200 with empty object when not found', async () => {
    mockExamenBocaRepo.getByHistoria.mockResolvedValue(null);
    await ExamenBocaController.consultarExamenBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await ExamenBocaController.consultarExamenBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockExamenBocaRepo.getByHistoria.mockRejectedValue(new Error('DB error'));
    await ExamenBocaController.consultarExamenBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ExamenBocaController.actualizarExamenBucal', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: { labios: 'anormal' } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockExamenBocaRepo.update.mockResolvedValue(undefined);
    await ExamenBocaController.actualizarExamenBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Examen de boca guardado correctamente',
    });
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await ExamenBocaController.actualizarExamenBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockExamenBocaRepo.update.mockRejectedValue(new Error('DB error'));
    await ExamenBocaController.actualizarExamenBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
