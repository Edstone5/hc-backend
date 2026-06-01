/**
 * Tests for auth/application/authController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$argon2_hashed'),
    verify: vi.fn(),
  },
}));

vi.mock('../services/tokenService.js', () => ({
  TokenService: {
    generateAccessToken: vi.fn().mockReturnValue('access_token'),
    generateRefreshToken: vi.fn().mockReturnValue({
      token: 'refresh_token',
      jti: 'jti-1',
      expiraEn: new Date('2030-01-01'),
    }),
    verifyRefreshToken: vi.fn(),
  },
}));

vi.mock('../services/cookieServices.js', () => ({
  CookieService: {
    setTokenCookies: vi.fn(),
    setAccessCookie: vi.fn(),
  },
}));

const mockAuthRepo = vi.hoisted(() => ({
  obtenerUsuarioPorUserCode: vi.fn(),
  guardarRefreshToken: vi.fn(),
  revocarRefreshToken: vi.fn(),
}));

vi.mock('../auth/infrastructure/authRepository.js', () => ({
  AuthRepository: class {
    constructor() {
      return mockAuthRepo;
    }
  },
}));

import argon2 from 'argon2';
import { AuthController } from '../auth/application/authController.js';
import { TokenService } from '../services/tokenService.js';

const authCtrl = new AuthController();

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn(), clearCookie: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('AuthController.iniciarSesion', () => {
  let req, res;
  beforeEach(() => {
    req = {
      body: { userCode: 'U001', password: 'Secret123' },
      user: null,
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 with user on successful login', async () => {
    mockAuthRepo.obtenerUsuarioPorUserCode.mockResolvedValue({
      id_usuario: '1',
      contrasena_hash: '$argon2_hashed',
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'j@test.com',
      rol: 'alumno',
    });
    argon2.verify.mockResolvedValue(true);
    await authCtrl.iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ userCode: 'U001' })
    );
    // El refresh token emitido se persiste (rotación/revocación, ADR-0028).
    expect(mockAuthRepo.guardarRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ jti: 'jti-1', idUsuario: '1' })
    );
  });

  it('returns 401 when user not found', async () => {
    mockAuthRepo.obtenerUsuarioPorUserCode.mockResolvedValue(null);
    await authCtrl.iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when password does not match', async () => {
    mockAuthRepo.obtenerUsuarioPorUserCode.mockResolvedValue({
      id_usuario: '1',
      contrasena_hash: '$argon2_hashed',
      nombre: 'Juan',
      apellido: 'Perez',
      email: 'j@test.com',
      rol: 'alumno',
    });
    argon2.verify.mockResolvedValue(false);
    await authCtrl.iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when user row has no hashed password', async () => {
    mockAuthRepo.obtenerUsuarioPorUserCode.mockResolvedValue({
      id_usuario: '1',
      nombre: 'Juan',
    });
    await authCtrl.iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 on DomainError (empty userCode)', async () => {
    req.body.userCode = '';
    await authCtrl.iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockAuthRepo.obtenerUsuarioPorUserCode.mockRejectedValue(
      new Error('DB error')
    );
    await authCtrl.iniciarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('AuthController.obtenerSesionActual', () => {
  it('returns 200 with current user', () => {
    const req = { user: { id: '1', userCode: 'U001' } };
    const res = makeRes();
    authCtrl.obtenerSesionActual(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: '1', userCode: 'U001' });
  });
});

describe('AuthController.cerrarSesion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 on logout y limpia cookies', async () => {
    const req = { cookies: {} };
    const res = makeRes();
    await authCtrl.cerrarSesion(req, res);
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', { path: '/' });
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('revoca el refresh token si está presente', async () => {
    TokenService.verifyRefreshToken.mockReturnValue({
      id: '1',
      type: 'refresh',
      jti: 'jti-1',
    });
    const req = { cookies: { refreshToken: 'rt' } };
    const res = makeRes();
    await authCtrl.cerrarSesion(req, res);
    expect(mockAuthRepo.revocarRefreshToken).toHaveBeenCalledWith(
      'jti-1',
      null
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
