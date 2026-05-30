/**
 * Tests for listaHcAdultos/application/listaHcAdultosController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockListaRepo = vi.hoisted(() => ({
  listarPorEstudiante: vi.fn(),
}));

vi.mock('../listaHcAdultos/infrastructure/listaHcAdultosRepository.js', () => ({
  ListaHcAdultosRepository: class {
    constructor() {
      return mockListaRepo;
    }
  },
}));

import { ListaHcAdultosController } from '../listaHcAdultos/application/listaHcAdultosController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('ListaHcAdultosController.listarHistoriasClinicasAdultasDeEstudiante', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id: UUID }, body: {} };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with list', async () => {
    mockListaRepo.listarPorEstudiante.mockResolvedValue([
      { id_historia: UUID },
    ]);
    await ListaHcAdultosController.listarHistoriasClinicasAdultasDeEstudiante(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id_historia: UUID }]);
  });

  it('returns 200 with empty array when null', async () => {
    mockListaRepo.listarPorEstudiante.mockResolvedValue(null);
    await ListaHcAdultosController.listarHistoriasClinicasAdultasDeEstudiante(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id = 'not-a-uuid';
    await ListaHcAdultosController.listarHistoriasClinicasAdultasDeEstudiante(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockListaRepo.listarPorEstudiante.mockRejectedValue(new Error('DB error'));
    await ListaHcAdultosController.listarHistoriasClinicasAdultasDeEstudiante(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
