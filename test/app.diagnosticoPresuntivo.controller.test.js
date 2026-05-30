/**
 * Tests for diagnosticoPresuntivo/application/diagnosticoPresuntivoController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDiagPresRepo = vi.hoisted(() => ({
  consultarPorHistoria: vi.fn(),
  actualizarDiagnosticoPresuntivo: vi.fn(),
}));

vi.mock(
  '../diagnosticoPresuntivo/infrastructure/diagnosticoPresuntivoRepository.js',
  () => ({
    DiagnosticoPresuntivoRepository: class {
      constructor() {
        return mockDiagPresRepo;
      }
    },
  })
);

import { DiagnosticoPresuntivoController } from '../diagnosticoPresuntivo/application/diagnosticoPresuntivoController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('DiagnosticoPresuntivoController.consultarDiagnosticoPresuntivo', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {}, user: { id: UUID } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockDiagPresRepo.consultarPorHistoria.mockResolvedValue({
      descripcion: 'Caries',
    });
    await DiagnosticoPresuntivoController.consultarDiagnosticoPresuntivo(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ descripcion: 'Caries' });
  });

  it('returns 200 with empty object when null', async () => {
    mockDiagPresRepo.consultarPorHistoria.mockResolvedValue(null);
    await DiagnosticoPresuntivoController.consultarDiagnosticoPresuntivo(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('returns 400 on DomainError (missing id)', async () => {
    req.params = {};
    await DiagnosticoPresuntivoController.consultarDiagnosticoPresuntivo(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockDiagPresRepo.consultarPorHistoria.mockRejectedValue(
      new Error('DB error')
    );
    await DiagnosticoPresuntivoController.consultarDiagnosticoPresuntivo(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('DiagnosticoPresuntivoController.actualizarDiagnosticoPresuntivo', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: { descripcion: 'Caries profunda' },
      user: { id: UUID },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockDiagPresRepo.actualizarDiagnosticoPresuntivo.mockResolvedValue(
      undefined
    );
    await DiagnosticoPresuntivoController.actualizarDiagnosticoPresuntivo(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Diagnóstico presuntivo guardado',
    });
  });

  it('returns 500 on unexpected error', async () => {
    mockDiagPresRepo.actualizarDiagnosticoPresuntivo.mockRejectedValue(
      new Error('DB error')
    );
    await DiagnosticoPresuntivoController.actualizarDiagnosticoPresuntivo(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
