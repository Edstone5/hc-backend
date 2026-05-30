/**
 * Tests for motivoConsulta/application/motivoConsultaController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMotivoRepo = vi.hoisted(() => ({
  create: vi.fn(),
  getByHistoria: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../motivoConsulta/infrastructure/motivoConsultaRepository.js', () => ({
  default: mockMotivoRepo,
}));

import { MotivoConsultaController } from '../motivoConsulta/application/motivoConsultaController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('MotivoConsultaController.registrarMotivoConsulta', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: { id_historia: UUID, motivo: 'Dolor de muela' },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 201 on success', async () => {
    mockMotivoRepo.create.mockResolvedValue(undefined);
    await MotivoConsultaController.registrarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    req.body.id_historia = 'bad-id';
    await MotivoConsultaController.registrarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockMotivoRepo.create.mockRejectedValue(new Error('DB error'));
    await MotivoConsultaController.registrarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('MotivoConsultaController.consultarMotivoConsulta', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {} };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockMotivoRepo.getByHistoria.mockResolvedValue({
      id_historia: UUID,
      motivo: 'Dolor',
    });
    await MotivoConsultaController.consultarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Motivo de consulta obtenido correctamente',
      })
    );
  });

  it('returns 404 when not found', async () => {
    mockMotivoRepo.getByHistoria.mockResolvedValue(null);
    await MotivoConsultaController.consultarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    await MotivoConsultaController.consultarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockMotivoRepo.getByHistoria.mockRejectedValue(new Error('DB error'));
    await MotivoConsultaController.consultarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('MotivoConsultaController.actualizarMotivoConsulta', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id_historia: UUID },
      body: { id_historia: UUID, motivo: 'Dolor actualizado' },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockMotivoRepo.getByHistoria.mockResolvedValue({ id_historia: UUID });
    mockMotivoRepo.update.mockResolvedValue(undefined);
    await MotivoConsultaController.actualizarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when motivo does not exist', async () => {
    mockMotivoRepo.getByHistoria.mockResolvedValue(null);
    await MotivoConsultaController.actualizarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-id';
    req.body.id_historia = 'bad-id';
    await MotivoConsultaController.actualizarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockMotivoRepo.getByHistoria.mockRejectedValue(new Error('DB error'));
    await MotivoConsultaController.actualizarMotivoConsulta(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
