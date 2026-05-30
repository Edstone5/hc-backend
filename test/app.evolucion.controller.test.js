/**
 * Tests for evolucion/application/evolucionController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEvolRepo = vi.hoisted(() => ({
  consultarEvoluciones: vi.fn(),
  registrarEvolucion: vi.fn(),
}));

vi.mock('../evolucion/infrastructure/evolucionRepository.js', () => ({
  EvolucionRepository: class {
    constructor() {
      return mockEvolRepo;
    }
  },
}));

import { EvolucionController } from '../evolucion/application/evolucionController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('EvolucionController.consultarEvoluciones', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {}, user: { id: UUID } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with list', async () => {
    mockEvolRepo.consultarEvoluciones.mockResolvedValue([{ id: 1 }]);
    await EvolucionController.consultarEvoluciones(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('returns 400 on DomainError (missing id)', async () => {
    req.params = {};
    await EvolucionController.consultarEvoluciones(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockEvolRepo.consultarEvoluciones.mockRejectedValue(new Error('DB error'));
    await EvolucionController.consultarEvoluciones(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('EvolucionController.registrarEvolucion', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: { fecha: '2025-01-15', actividad: 'Extracción', alumno: 'Est01' },
      user: { id: UUID },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 201 on success', async () => {
    mockEvolRepo.registrarEvolucion.mockResolvedValue(undefined);
    await EvolucionController.registrarEvolucion(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Evolución registrada correctamente',
    });
  });

  it('returns 500 on unexpected error', async () => {
    mockEvolRepo.registrarEvolucion.mockRejectedValue(new Error('DB error'));
    await EvolucionController.registrarEvolucion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
