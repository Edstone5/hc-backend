/**
 * Tests for antecedente/application/antecedenteController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAntRepo = vi.hoisted(() => ({
  createAntecedentePersonal: vi.fn(),
  getAntecedentePersonalByHistoria: vi.fn(),
  updateAntecedentePersonal: vi.fn(),
  createAntecedenteMedico: vi.fn(),
  getAntecedenteMedicoByHistoria: vi.fn(),
  updateAntecedenteMedico: vi.fn(),
  createAntecedenteFamiliar: vi.fn(),
  getAntecedenteFamiliarByHistoria: vi.fn(),
  updateAntecedenteFamiliar: vi.fn(),
  createAntecedenteCumplimiento: vi.fn(),
  getAntecedenteCumplimientoByHistoria: vi.fn(),
  updateAntecedenteCumplimiento: vi.fn(),
}));

vi.mock('../antecedente/infrastructure/antecedenteRepository.js', () => ({
  default: mockAntRepo,
}));

import { AntecedenteController } from '../antecedente/application/antecedenteController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

function makeReq(extraBody = {}) {
  return {
    params: { id_historia: UUID },
    body: { id_historia: UUID, ...extraBody },
  };
}

// ── Antecedentes Personales No Patológicos ───────────────────────────────────
describe('AntecedenteController — personal no patológico', () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    vi.clearAllMocks();
  });

  it('registrar: returns 201 on success', async () => {
    mockAntRepo.createAntecedentePersonal.mockResolvedValue(undefined);
    await AntecedenteController.registrarAntecedentesPersonalesNoPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('registrar: returns 400 on DomainError (invalid UUID)', async () => {
    const req = {
      params: { id_historia: 'bad' },
      body: { id_historia: 'bad' },
    };
    await AntecedenteController.registrarAntecedentesPersonalesNoPatologicos(
      req,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('registrar: returns 500 on error', async () => {
    mockAntRepo.createAntecedentePersonal.mockRejectedValue(
      new Error('DB error')
    );
    await AntecedenteController.registrarAntecedentesPersonalesNoPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('consultar: returns 200 when found', async () => {
    mockAntRepo.getAntecedentePersonalByHistoria.mockResolvedValue({ id: 1 });
    await AntecedenteController.consultarAntecedentesPersonalesNoPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('consultar: returns 404 when not found', async () => {
    mockAntRepo.getAntecedentePersonalByHistoria.mockResolvedValue(null);
    await AntecedenteController.consultarAntecedentesPersonalesNoPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('consultar: returns 500 on error', async () => {
    mockAntRepo.getAntecedentePersonalByHistoria.mockRejectedValue(
      new Error('DB error')
    );
    await AntecedenteController.consultarAntecedentesPersonalesNoPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('actualizar: returns 200 on success', async () => {
    mockAntRepo.getAntecedentePersonalByHistoria.mockResolvedValue({ id: 1 });
    mockAntRepo.updateAntecedentePersonal.mockResolvedValue(undefined);
    await AntecedenteController.actualizarAntecedentesPersonalesNoPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('actualizar: returns 404 when not found', async () => {
    mockAntRepo.getAntecedentePersonalByHistoria.mockResolvedValue(null);
    await AntecedenteController.actualizarAntecedentesPersonalesNoPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── Antecedentes Personales Patológicos (Médico) ─────────────────────────────
describe('AntecedenteController — personal patológico (médico)', () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    vi.clearAllMocks();
  });

  it('registrar: returns 201 on success', async () => {
    mockAntRepo.createAntecedenteMedico.mockResolvedValue(undefined);
    await AntecedenteController.registrarAntecedentesPersonalesPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('registrar: returns 500 on error', async () => {
    mockAntRepo.createAntecedenteMedico.mockRejectedValue(
      new Error('DB error')
    );
    await AntecedenteController.registrarAntecedentesPersonalesPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('consultar: returns 200 when found', async () => {
    mockAntRepo.getAntecedenteMedicoByHistoria.mockResolvedValue({ id: 2 });
    await AntecedenteController.consultarAntecedentesPersonalesPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('consultar: returns 404 when not found', async () => {
    mockAntRepo.getAntecedenteMedicoByHistoria.mockResolvedValue(null);
    await AntecedenteController.consultarAntecedentesPersonalesPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('actualizar: returns 200 on success', async () => {
    mockAntRepo.getAntecedenteMedicoByHistoria.mockResolvedValue({ id: 2 });
    mockAntRepo.updateAntecedenteMedico.mockResolvedValue(undefined);
    await AntecedenteController.actualizarAntecedentesPersonalesPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('actualizar: returns 404 when not found', async () => {
    mockAntRepo.getAntecedenteMedicoByHistoria.mockResolvedValue(null);
    await AntecedenteController.actualizarAntecedentesPersonalesPatologicos(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── Antecedentes Heredo-Familiares ───────────────────────────────────────────
describe('AntecedenteController — heredo familiar', () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    vi.clearAllMocks();
  });

  it('registrar: returns 201 on success', async () => {
    mockAntRepo.createAntecedenteFamiliar.mockResolvedValue(undefined);
    await AntecedenteController.registrarAntecedentesHeredoFamiliares(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('registrar: returns 500 on error', async () => {
    mockAntRepo.createAntecedenteFamiliar.mockRejectedValue(
      new Error('DB error')
    );
    await AntecedenteController.registrarAntecedentesHeredoFamiliares(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('consultar: returns 200 when found', async () => {
    mockAntRepo.getAntecedenteFamiliarByHistoria.mockResolvedValue({ id: 3 });
    await AntecedenteController.consultarAntecedentesHeredoFamiliares(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('consultar: returns 404 when not found', async () => {
    mockAntRepo.getAntecedenteFamiliarByHistoria.mockResolvedValue(null);
    await AntecedenteController.consultarAntecedentesHeredoFamiliares(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('actualizar: returns 200 on success', async () => {
    mockAntRepo.getAntecedenteFamiliarByHistoria.mockResolvedValue({ id: 3 });
    mockAntRepo.updateAntecedenteFamiliar.mockResolvedValue(undefined);
    await AntecedenteController.actualizarAntecedentesHeredoFamiliares(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('actualizar: returns 404 when not found', async () => {
    mockAntRepo.getAntecedenteFamiliarByHistoria.mockResolvedValue(null);
    await AntecedenteController.actualizarAntecedentesHeredoFamiliares(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── Seguimiento del Tratamiento ──────────────────────────────────────────────
describe('AntecedenteController — seguimiento tratamiento', () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    vi.clearAllMocks();
  });

  it('registrar: returns 201 on success', async () => {
    mockAntRepo.createAntecedenteCumplimiento.mockResolvedValue(undefined);
    await AntecedenteController.registrarSeguimientoDelTratamiento(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('registrar: returns 500 on error', async () => {
    mockAntRepo.createAntecedenteCumplimiento.mockRejectedValue(
      new Error('DB error')
    );
    await AntecedenteController.registrarSeguimientoDelTratamiento(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('consultar: returns 200 when found', async () => {
    mockAntRepo.getAntecedenteCumplimientoByHistoria.mockResolvedValue({
      id: 4,
    });
    await AntecedenteController.consultarSeguimientoDelTratamiento(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('consultar: returns 404 when not found', async () => {
    mockAntRepo.getAntecedenteCumplimientoByHistoria.mockResolvedValue(null);
    await AntecedenteController.consultarSeguimientoDelTratamiento(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('actualizar: returns 200 on success', async () => {
    mockAntRepo.getAntecedenteCumplimientoByHistoria.mockResolvedValue({
      id: 4,
    });
    mockAntRepo.updateAntecedenteCumplimiento.mockResolvedValue(undefined);
    await AntecedenteController.actualizarSeguimientoDelTratamiento(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('actualizar: returns 404 when not found', async () => {
    mockAntRepo.getAntecedenteCumplimientoByHistoria.mockResolvedValue(null);
    await AntecedenteController.actualizarSeguimientoDelTratamiento(
      makeReq(),
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
