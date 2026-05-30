/**
 * Tests for examenRegional/application/examenRegionalController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExamenRegionalRepo = vi.hoisted(() => ({
  create: vi.fn(),
  getByHistoria: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../examenRegional/infrastructure/examenRegionalRepository.js', () => ({
  default: mockExamenRegionalRepo,
}));

import { ExamenRegionalController } from '../examenRegional/application/examenRegionalController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('ExamenRegionalController.registrarExamenFisicoRegional', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: { cabeza: 'normal' } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 201 on success', async () => {
    mockExamenRegionalRepo.create.mockResolvedValue({ id: 1 });
    await ExamenRegionalController.registrarExamenFisicoRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await ExamenRegionalController.registrarExamenFisicoRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockExamenRegionalRepo.create.mockRejectedValue(new Error('DB error'));
    await ExamenRegionalController.registrarExamenFisicoRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ExamenRegionalController.consultarExamenFisicoRegional', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {} };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockExamenRegionalRepo.getByHistoria.mockResolvedValue({
      cabeza: 'normal',
    });
    await ExamenRegionalController.consultarExamenFisicoRegional(req, res);
    expect(res.json).toHaveBeenCalledWith({ cabeza: 'normal' });
  });

  it('returns 200 with empty object when not found', async () => {
    mockExamenRegionalRepo.getByHistoria.mockResolvedValue(null);
    await ExamenRegionalController.consultarExamenFisicoRegional(req, res);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await ExamenRegionalController.consultarExamenFisicoRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockExamenRegionalRepo.getByHistoria.mockRejectedValue(
      new Error('DB error')
    );
    await ExamenRegionalController.consultarExamenFisicoRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ExamenRegionalController.actualizarExamenFisicoRegional', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: { cabeza: 'anormal' } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockExamenRegionalRepo.update.mockResolvedValue(undefined);
    await ExamenRegionalController.actualizarExamenFisicoRegional(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Actualizado' });
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await ExamenRegionalController.actualizarExamenFisicoRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockExamenRegionalRepo.update.mockRejectedValue(new Error('DB error'));
    await ExamenRegionalController.actualizarExamenFisicoRegional(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
