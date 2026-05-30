/**
 * Tests for derivacionClinicas/application/derivacionClinicasController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDerivRepo = vi.hoisted(() => ({
  consultarPorHistoria: vi.fn(),
  actualizarDerivacionClinicas: vi.fn(),
}));

vi.mock(
  '../derivacionClinicas/infrastructure/derivacionClinicasRepository.js',
  () => ({
    DerivacionClinicasRepository: class {
      constructor() {
        return mockDerivRepo;
      }
    },
  })
);

import { DerivacionClinicasController } from '../derivacionClinicas/application/derivacionClinicasController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('DerivacionClinicasController.consultarDerivacionClinicas', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {}, user: { id: UUID } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockDerivRepo.consultarPorHistoria.mockResolvedValue({ destinos: [] });
    await DerivacionClinicasController.consultarDerivacionClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ destinos: [] });
  });

  it('returns 200 with empty object when null', async () => {
    mockDerivRepo.consultarPorHistoria.mockResolvedValue(null);
    await DerivacionClinicasController.consultarDerivacionClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('returns 400 on DomainError (missing id)', async () => {
    req.params = {};
    await DerivacionClinicasController.consultarDerivacionClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockDerivRepo.consultarPorHistoria.mockRejectedValue(new Error('DB error'));
    await DerivacionClinicasController.consultarDerivacionClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('DerivacionClinicasController.actualizarDerivacionClinicas', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: {
        destinos: [],
        observaciones: 'obs',
        alumno: 'Al',
        docente: 'Doc',
      },
      user: { id: UUID },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockDerivRepo.actualizarDerivacionClinicas.mockResolvedValue(undefined);
    await DerivacionClinicasController.actualizarDerivacionClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Derivación guardada correctamente',
    });
  });

  it('returns 500 on unexpected error', async () => {
    mockDerivRepo.actualizarDerivacionClinicas.mockRejectedValue(
      new Error('DB error')
    );
    await DerivacionClinicasController.actualizarDerivacionClinicas(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
