/**
 * Tests for hc/application/hcController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockHcRepo = vi.hoisted(() => ({
  crearRevision: vi.fn(),
  obtenerPacientePorHistoria: vi.fn(),
  listarHistoriasPorEstudiante: vi.fn(),
  crearHistoriaClinica: vi.fn(),
  obtenerBorrador: vi.fn(),
  asignarPaciente: vi.fn(),
}));

vi.mock('../hc/infrastructure/hcRepository.js', () => ({
  HcRepository: class {
    constructor() {
      return mockHcRepo;
    }
  },
}));

import { HcController } from '../hc/application/hcController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

function makeController() {
  return new HcController();
}

// ── registrarRevisionHistoriaClinica ──────────────────────────────────────────
describe('HcController.registrarRevisionHistoriaClinica', () => {
  let req, res, ctrl;
  beforeEach(() => {
    req = {
      body: {
        idHistory: UUID,
        idTeacher: UUID,
        state: 'aprobado',
        observations: 'ok',
      },
      params: {},
      user: { id: UUID },
    };
    res = makeRes();
    ctrl = makeController();
    vi.clearAllMocks();
  });

  it('returns 201 when revision created', async () => {
    mockHcRepo.crearRevision.mockResolvedValue(true);
    await ctrl.registrarRevisionHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 500 when repo returns false', async () => {
    mockHcRepo.crearRevision.mockResolvedValue(false);
    await ctrl.registrarRevisionHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 500 on unexpected error', async () => {
    mockHcRepo.crearRevision.mockRejectedValue(new Error('DB error'));
    await ctrl.registrarRevisionHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── consultarPacientePorHistoriaClinica ───────────────────────────────────────
describe('HcController.consultarPacientePorHistoriaClinica', () => {
  let req, res, ctrl;
  beforeEach(() => {
    req = { params: { id: UUID }, body: {}, user: { id: UUID } };
    res = makeRes();
    ctrl = makeController();
    vi.clearAllMocks();
  });

  it('returns 200 when patient found', async () => {
    mockHcRepo.obtenerPacientePorHistoria.mockResolvedValue({ id: UUID });
    await ctrl.consultarPacientePorHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: UUID });
  });

  it('returns 404 when patient not found', async () => {
    mockHcRepo.obtenerPacientePorHistoria.mockResolvedValue(null);
    await ctrl.consultarPacientePorHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    mockHcRepo.obtenerPacientePorHistoria.mockRejectedValue(
      new Error('DB error')
    );
    await ctrl.consultarPacientePorHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── listarHistoriasClinicasPorEstudiante ──────────────────────────────────────
describe('HcController.listarHistoriasClinicasPorEstudiante', () => {
  let req, res, ctrl;
  beforeEach(() => {
    req = { params: { id: UUID }, body: {}, user: { id: UUID } };
    res = makeRes();
    ctrl = makeController();
    vi.clearAllMocks();
  });

  it('returns 200 with list', async () => {
    mockHcRepo.listarHistoriasPorEstudiante.mockResolvedValue([{ id: UUID }]);
    await ctrl.listarHistoriasClinicasPorEstudiante(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: UUID }]);
  });

  it('returns 500 on error', async () => {
    mockHcRepo.listarHistoriasPorEstudiante.mockRejectedValue(
      new Error('DB error')
    );
    await ctrl.listarHistoriasClinicasPorEstudiante(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── registrarHistoriaClinica ──────────────────────────────────────────────────
describe('HcController.registrarHistoriaClinica', () => {
  let req, res, ctrl;
  beforeEach(() => {
    req = { body: { idStudent: UUID }, params: {}, user: { id: UUID } };
    res = makeRes();
    ctrl = makeController();
    vi.clearAllMocks();
  });

  it('returns 201 when created', async () => {
    mockHcRepo.crearHistoriaClinica.mockResolvedValue({ id: UUID });
    await ctrl.registrarHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 500 when repo returns null', async () => {
    mockHcRepo.crearHistoriaClinica.mockResolvedValue(null);
    await ctrl.registrarHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 500 on error', async () => {
    mockHcRepo.crearHistoriaClinica.mockRejectedValue(new Error('DB error'));
    await ctrl.registrarHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── obtenerBorradorHistoriaClinica ────────────────────────────────────────────
describe('HcController.obtenerBorradorHistoriaClinica', () => {
  let req, res, ctrl;
  beforeEach(() => {
    req = { params: { id: UUID }, body: {}, user: { id: UUID } };
    res = makeRes();
    ctrl = makeController();
    vi.clearAllMocks();
  });

  it('returns 200 with id_historia', async () => {
    mockHcRepo.obtenerBorrador.mockResolvedValue({ id_historia: UUID });
    await ctrl.obtenerBorradorHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id_historia: UUID });
  });

  it('returns 500 on error', async () => {
    mockHcRepo.obtenerBorrador.mockRejectedValue(new Error('DB error'));
    await ctrl.obtenerBorradorHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── asignarPacienteAHistoriaClinica ───────────────────────────────────────────
describe('HcController.asignarPacienteAHistoriaClinica', () => {
  let req, res, ctrl;
  beforeEach(() => {
    req = {
      body: { idHistory: UUID, idPatient: UUID },
      params: {},
      user: { id: UUID },
    };
    res = makeRes();
    ctrl = makeController();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockHcRepo.asignarPaciente.mockResolvedValue(undefined);
    await ctrl.asignarPacienteAHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 on error', async () => {
    mockHcRepo.asignarPaciente.mockRejectedValue(new Error('DB error'));
    await ctrl.asignarPacienteAHistoriaClinica(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
