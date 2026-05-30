/**
 * Tests for examenGeneral/application/examenGeneralController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExamenGeneralRepo = vi.hoisted(() => ({
  create: vi.fn(),
  getByHistoria: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../examenGeneral/infrastructure/examenGeneralRepository.js', () => ({
  default: mockExamenGeneralRepo,
}));

import { ExamenGeneralController } from '../examenGeneral/application/examenGeneralController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('ExamenGeneralController.registrarExamenFisicoGeneral', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: { peso: 70, talla: 1.75 },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 201 on success', async () => {
    mockExamenGeneralRepo.create.mockResolvedValue({ id: 1 });
    await ExamenGeneralController.registrarExamenFisicoGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await ExamenGeneralController.registrarExamenFisicoGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockExamenGeneralRepo.create.mockRejectedValue(new Error('DB error'));
    await ExamenGeneralController.registrarExamenFisicoGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ExamenGeneralController.consultarExamenFisicoGeneral', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {} };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockExamenGeneralRepo.getByHistoria.mockResolvedValue({ peso: 70 });
    await ExamenGeneralController.consultarExamenFisicoGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ peso: 70 });
  });

  it('returns 200 with empty object when not found', async () => {
    mockExamenGeneralRepo.getByHistoria.mockResolvedValue(null);
    await ExamenGeneralController.consultarExamenFisicoGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await ExamenGeneralController.consultarExamenFisicoGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockExamenGeneralRepo.getByHistoria.mockRejectedValue(
      new Error('DB error')
    );
    await ExamenGeneralController.consultarExamenFisicoGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('ExamenGeneralController.actualizarExamenFisicoGeneral', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: { peso: 72 } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockExamenGeneralRepo.update.mockResolvedValue(undefined);
    await ExamenGeneralController.actualizarExamenFisicoGeneral(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Actualizado' });
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await ExamenGeneralController.actualizarExamenFisicoGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockExamenGeneralRepo.update.mockRejectedValue(new Error('DB error'));
    await ExamenGeneralController.actualizarExamenFisicoGeneral(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
