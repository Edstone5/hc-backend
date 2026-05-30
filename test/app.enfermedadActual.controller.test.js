/**
 * Tests for enfermedadActual/application/enfermedadActualController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnfRepo = vi.hoisted(() => ({
  create: vi.fn(),
  getByHistoria: vi.fn(),
  update: vi.fn(),
}));

vi.mock(
  '../enfermedadActual/infrastructure/enfermedadActualRepository.js',
  () => ({
    default: mockEnfRepo,
  })
);

import { EnfermedadActualController } from '../enfermedadActual/application/enfermedadActualController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('EnfermedadActualController.registrarEnfermedadActual', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: { id_historia: UUID, sintoma_principal: 'Dolor' },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 201 on success', async () => {
    mockEnfRepo.create.mockResolvedValue({ id: 1 });
    await EnfermedadActualController.registrarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    req.body.id_historia = 'bad-id';
    await EnfermedadActualController.registrarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockEnfRepo.create.mockRejectedValue(new Error('DB error'));
    await EnfermedadActualController.registrarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('EnfermedadActualController.consultarEnfermedadActual', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {} };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockEnfRepo.getByHistoria.mockResolvedValue({ descripcion: 'Gripe' });
    await EnfermedadActualController.consultarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when not found', async () => {
    mockEnfRepo.getByHistoria.mockResolvedValue(null);
    await EnfermedadActualController.consultarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await EnfermedadActualController.consultarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockEnfRepo.getByHistoria.mockRejectedValue(new Error('DB error'));
    await EnfermedadActualController.consultarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('EnfermedadActualController.actualizarEnfermedadActual', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: { id_historia: UUID, sintoma_principal: 'Dolor' },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockEnfRepo.getByHistoria.mockResolvedValue({ id: 1 });
    mockEnfRepo.update.mockResolvedValue({ id: 1 });
    await EnfermedadActualController.actualizarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when not found', async () => {
    mockEnfRepo.getByHistoria.mockResolvedValue(null);
    await EnfermedadActualController.actualizarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    req.body.id_historia = 'bad-id';
    await EnfermedadActualController.actualizarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockEnfRepo.getByHistoria.mockRejectedValue(new Error('DB error'));
    await EnfermedadActualController.actualizarEnfermedadActual(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
