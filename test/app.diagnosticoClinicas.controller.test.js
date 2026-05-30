/**
 * Tests for diagnosticoClinicas/application/diagnosticoClinicasController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDiagCliRepo = vi.hoisted(() => ({
  consultarPorHistoria: vi.fn(),
  actualizarDiagnosticoClinicas: vi.fn(),
}));

vi.mock(
  '../diagnosticoClinicas/infrastructure/diagnosticoClinicasRepository.js',
  () => ({
    DiagnosticoClinicasRepository: class {
      constructor() {
        return mockDiagCliRepo;
      }
    },
  })
);

import { DiagnosticoClinicasController } from '../diagnosticoClinicas/application/diagnosticoClinicasController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('DiagnosticoClinicasController.consultarDiagnosticoClinico', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {}, user: { id: UUID } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockDiagCliRepo.consultarPorHistoria.mockResolvedValue({
      pronostico: 'Bueno',
    });
    await DiagnosticoClinicasController.consultarDiagnosticoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ pronostico: 'Bueno' });
  });

  it('returns 200 with empty object when null', async () => {
    mockDiagCliRepo.consultarPorHistoria.mockResolvedValue(null);
    await DiagnosticoClinicasController.consultarDiagnosticoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('returns 400 on DomainError (missing id)', async () => {
    req.params = {};
    await DiagnosticoClinicasController.consultarDiagnosticoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockDiagCliRepo.consultarPorHistoria.mockRejectedValue(
      new Error('DB error')
    );
    await DiagnosticoClinicasController.consultarDiagnosticoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('DiagnosticoClinicasController.actualizarDiagnosticoClinico', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: { pronostico: 'Favorable', alumnoTratante: 'Est01' },
      user: { id: UUID },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockDiagCliRepo.actualizarDiagnosticoClinicas.mockResolvedValue(undefined);
    await DiagnosticoClinicasController.actualizarDiagnosticoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Información clínica guardada correctamente',
    });
  });

  it('returns 400 on DomainError (missing id)', async () => {
    req.params = {};
    await DiagnosticoClinicasController.actualizarDiagnosticoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockDiagCliRepo.actualizarDiagnosticoClinicas.mockRejectedValue(
      new Error('DB error')
    );
    await DiagnosticoClinicasController.actualizarDiagnosticoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
