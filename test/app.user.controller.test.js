/**
 * Tests for user/application/userController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('argon2', () => ({
  default: { hash: vi.fn().mockResolvedValue('$argon2_hashed') },
}));

const mockUserRepo = vi.hoisted(() => ({
  listarUsuarios: vi.fn(),
  registrarUsuario: vi.fn(),
  obtenerUsuarioPorId: vi.fn(),
}));

vi.mock('../user/infrastructure/userRepository.js', () => ({
  UserRepository: class {
    constructor() {
      return mockUserRepo;
    }
  },
}));

import { UserController } from '../user/application/userController.js';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('UserController.listarUsuarios', () => {
  let req, res;
  beforeEach(() => {
    req = { body: {}, params: {} };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with user list', async () => {
    mockUserRepo.listarUsuarios.mockResolvedValue([{ id: 1 }]);
    await UserController.listarUsuarios(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('returns 500 on error', async () => {
    mockUserRepo.listarUsuarios.mockRejectedValue(new Error('DB error'));
    await UserController.listarUsuarios(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('UserController.registrarUsuario', () => {
  let req, res;
  beforeEach(() => {
    req = {
      body: {
        userCode: 'U001',
        firstName: 'Juan',
        lastName: 'Perez',
        dni: '12345678',
        email: 'juan@test.com',
        role: 'alumno',
        password: 'Secret123',
      },
      params: {},
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 201 with created user info', async () => {
    mockUserRepo.registrarUsuario.mockResolvedValue(undefined);
    await UserController.registrarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ userCode: 'U001' })
    );
  });

  it('returns 400 on DomainError (invalid email)', async () => {
    req.body.email = 'not-an-email';
    await UserController.registrarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected repo error', async () => {
    mockUserRepo.registrarUsuario.mockRejectedValue(new Error('DB error'));
    await UserController.registrarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('UserController.obtenerUsuarioPorId', () => {
  let req, res;
  beforeEach(() => {
    req = { params: { id: '1' }, body: {} };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 when user found', async () => {
    mockUserRepo.obtenerUsuarioPorId.mockResolvedValue({ id: 1 });
    await UserController.obtenerUsuarioPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it('returns 404 when user not found', async () => {
    mockUserRepo.obtenerUsuarioPorId.mockResolvedValue(null);
    await UserController.obtenerUsuarioPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    mockUserRepo.obtenerUsuarioPorId.mockRejectedValue(new Error('DB error'));
    await UserController.obtenerUsuarioPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
