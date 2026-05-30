import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPagoRepo = vi.hoisted(() => ({
  registrarPago: vi.fn(),
  consultarPorHistoria: vi.fn(),
}));

vi.mock('../pago/infrastructure/pagoRepository.js', () => ({
  PagoRepository: class {
    constructor() {
      return mockPagoRepo;
    }
  },
}));

import { PagoController } from '../pago/application/pagoController.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('PagoController.registrarPago', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id: UUID },
      body: {},
      user: { id: UUID, role: 'administrador' },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('devuelve 201 al registrar pago exitosamente', async () => {
    mockPagoRepo.registrarPago.mockResolvedValue(true);
    await PagoController.registrarPago(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('devuelve 400 si id_historia es inválido', async () => {
    req.params.id = 'no-uuid';
    await PagoController.registrarPago(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('devuelve 500 si el repositorio falla', async () => {
    mockPagoRepo.registrarPago.mockRejectedValue(new Error('DB fail'));
    await PagoController.registrarPago(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('PagoController.consultarPorHistoria', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id: UUID }, user: { id: UUID } };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('devuelve 200 con lista de pagos', async () => {
    mockPagoRepo.consultarPorHistoria.mockResolvedValue([
      { id_pago: UUID, monto: 2.0 },
    ]);
    await PagoController.consultarPorHistoria(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('devuelve 400 si falta id', async () => {
    req.params = {};
    await PagoController.consultarPorHistoria(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
