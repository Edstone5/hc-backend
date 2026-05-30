/**
 * Tests for filiacion/application/filiacionController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFiliacionRepo = vi.hoisted(() => ({
  create: vi.fn(),
  getByHistoria: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../filiacion/infrastructure/filiacionRepository.js', () => ({
  default: mockFiliacionRepo,
}));

import { ModuloController } from '../filiacion/application/filiacionController.js';

// UUID v4 válido para las pruebas
const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('FiliacionController.registrarDatosPersonalesPaciente', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: { id_historia: UUID } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 201 on success', async () => {
    mockFiliacionRepo.create.mockResolvedValue(undefined);
    await ModuloController.registrarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Filiacion registrada con exito',
    });
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-uuid';
    req.body.id_historia = 'bad-uuid';
    await ModuloController.registrarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected repo error', async () => {
    mockFiliacionRepo.create.mockRejectedValue(new Error('DB error'));
    await ModuloController.registrarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('FiliacionController.consultarDatosPersonalesPaciente', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: {} };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with data when found', async () => {
    mockFiliacionRepo.getByHistoria.mockResolvedValue({ id_historia: UUID });
    await ModuloController.consultarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Filiacion obtenida correctamente' })
    );
  });

  it('returns 404 when not found', async () => {
    mockFiliacionRepo.getByHistoria.mockResolvedValue(null);
    await ModuloController.consultarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'not-a-uuid';
    await ModuloController.consultarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected repo error', async () => {
    mockFiliacionRepo.getByHistoria.mockRejectedValue(new Error('DB error'));
    await ModuloController.consultarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('FiliacionController.actualizarDatosPersonalesPaciente', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id_historia: UUID }, body: { id_historia: UUID } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockFiliacionRepo.getByHistoria.mockResolvedValue({ id_historia: UUID });
    mockFiliacionRepo.update.mockResolvedValue(undefined);
    await ModuloController.actualizarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when filiacion does not exist', async () => {
    mockFiliacionRepo.getByHistoria.mockResolvedValue(null);
    await ModuloController.actualizarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id_historia = 'bad-uuid';
    req.body.id_historia = 'bad-uuid';
    await ModuloController.actualizarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected repo error', async () => {
    mockFiliacionRepo.getByHistoria.mockRejectedValue(new Error('DB error'));
    await ModuloController.actualizarDatosPersonalesPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
