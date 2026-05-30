/**
 * Tests for catalogo/application/catalogoController.js
 * Mocks the infrastructure repository so no real DB is needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoist mock refs so they are available inside the vi.mock factory ──────────
const mockRepo = vi.hoisted(() => ({
  listar: vi.fn(),
  obtenerNombre: vi.fn(),
}));

vi.mock('../catalogo/infrastructure/catalogoRepository.js', () => ({
  CatalogoRepository: class {
    constructor() {
      return mockRepo;
    }
  },
}));

import { CatalogoController } from '../catalogo/application/catalogoController.js';

// ── helpers ───────────────────────────────────────────────────────────────────
function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

const VALID_CATALOG = 'catalogo_sexo';
const VALID_ID = '1';

// ── listarOpcionesCatalogoClinico ─────────────────────────────────────────────
describe('CatalogoController.listarOpcionesCatalogoClinico', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { nombre: VALID_CATALOG } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with rows on success', async () => {
    mockRepo.listar.mockResolvedValue([{ id: 1, descripcion: 'Masculino' }]);
    await CatalogoController.listarOpcionesCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { id: 1, descripcion: 'Masculino' },
    ]);
  });

  it('returns 404 when repo returns empty array', async () => {
    mockRepo.listar.mockResolvedValue([]);
    await CatalogoController.listarOpcionesCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No data found for this catalog',
    });
  });

  it('returns 404 when repo returns null', async () => {
    mockRepo.listar.mockResolvedValue(null);
    await CatalogoController.listarOpcionesCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on DomainError (invalid catalog name)', async () => {
    req.params.nombre = 'catalogo_inexistente_xyz';
    await CatalogoController.listarOpcionesCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected repo error', async () => {
    mockRepo.listar.mockRejectedValue(new Error('DB down'));
    await CatalogoController.listarOpcionesCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── obtenerNombreOpcionCatalogoClinico ────────────────────────────────────────
describe('CatalogoController.obtenerNombreOpcionCatalogoClinico', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { nombre: VALID_CATALOG, id: VALID_ID } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with nombre on success', async () => {
    mockRepo.obtenerNombre.mockResolvedValue('Masculino');
    await CatalogoController.obtenerNombreOpcionCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: 1, nombre: 'Masculino' });
  });

  it('returns 404 when nombre is not found', async () => {
    mockRepo.obtenerNombre.mockResolvedValue(null);
    await CatalogoController.obtenerNombreOpcionCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 on DomainError (invalid catalog name)', async () => {
    req.params.nombre = 'catalogo_inexistente_xyz';
    await CatalogoController.obtenerNombreOpcionCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 on DomainError (invalid id)', async () => {
    req.params.id = '-5';
    await CatalogoController.obtenerNombreOpcionCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected repo error', async () => {
    mockRepo.obtenerNombre.mockRejectedValue(new Error('DB down'));
    await CatalogoController.obtenerNombreOpcionCatalogoClinico(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
