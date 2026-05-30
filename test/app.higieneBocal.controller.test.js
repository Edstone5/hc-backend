/**
 * Tests for higieneBocal/application/higieneBocalController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockHigieneRepo = vi.hoisted(() => ({
  consultarPorHistoria: vi.fn(),
  actualizarHigieneBocal: vi.fn(),
}));

vi.mock('../higieneBocal/infrastructure/higieneBocalRepository.js', () => ({
  HigieneBocalRepository: class {
    constructor() {
      return mockHigieneRepo;
    }
  },
}));

import { HigieneBocalController } from '../higieneBocal/application/higieneBocalController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('HigieneBocalController.consultarHigieneBucal', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {}, user: { id: UUID } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockHigieneRepo.consultarPorHistoria.mockResolvedValue({ ihos: 0.5 });
    await HigieneBocalController.consultarHigieneBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ihos: 0.5 });
  });

  it('returns 200 with empty object when not found', async () => {
    mockHigieneRepo.consultarPorHistoria.mockResolvedValue(null);
    await HigieneBocalController.consultarHigieneBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('returns 400 on DomainError', async () => {
    const { DomainError } = await import(
      '../higieneBocal/domain/higieneBocalDomain.js'
    );
    mockHigieneRepo.consultarPorHistoria.mockRejectedValue(
      new DomainError('Error de dominio')
    );
    await HigieneBocalController.consultarHigieneBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockHigieneRepo.consultarPorHistoria.mockRejectedValue(
      new Error('DB error')
    );
    await HigieneBocalController.consultarHigieneBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('HigieneBocalController.actualizarHigieneBucal', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: { ihos: 1.2, estadoHigiene: 'Bueno' },
      user: { id: UUID },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockHigieneRepo.actualizarHigieneBocal.mockResolvedValue(undefined);
    await HigieneBocalController.actualizarHigieneBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Higiene bucal guardada correctamente',
    });
  });

  it('returns 400 on DomainError', async () => {
    const { DomainError } = await import(
      '../higieneBocal/domain/higieneBocalDomain.js'
    );
    mockHigieneRepo.actualizarHigieneBocal.mockRejectedValue(
      new DomainError('Error de dominio')
    );
    await HigieneBocalController.actualizarHigieneBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockHigieneRepo.actualizarHigieneBocal.mockRejectedValue(
      new Error('DB error')
    );
    await HigieneBocalController.actualizarHigieneBucal(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
