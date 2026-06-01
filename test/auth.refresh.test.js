import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de servicios y repositorio antes de importar el controlador DDD.
vi.mock('../services/tokenService.js', () => ({
  TokenService: {
    generateAccessToken: vi.fn(() => 'newAccess'),
    generateRefreshToken: vi.fn(() => ({
      token: 'newRefresh',
      jti: 'jti-new',
      expiraEn: new Date('2030-01-01'),
    })),
    verifyRefreshToken: vi.fn(),
  },
}));
vi.mock('../services/cookieServices.js', () => ({
  CookieService: {
    setTokenCookies: vi.fn(),
    setAccessCookie: vi.fn(),
  },
}));

const obtenerUsuarioPorId = vi.fn();
const obtenerRefreshToken = vi.fn();
const guardarRefreshToken = vi.fn();
const revocarRefreshToken = vi.fn();
const revocarTodosRefreshTokensDeUsuario = vi.fn();
vi.mock('../auth/infrastructure/authRepository.js', () => ({
  AuthRepository: class {
    obtenerUsuarioPorId(...a) {
      return obtenerUsuarioPorId(...a);
    }
    obtenerRefreshToken(...a) {
      return obtenerRefreshToken(...a);
    }
    guardarRefreshToken(...a) {
      return guardarRefreshToken(...a);
    }
    revocarRefreshToken(...a) {
      return revocarRefreshToken(...a);
    }
    revocarTodosRefreshTokensDeUsuario(...a) {
      return revocarTodosRefreshTokensDeUsuario(...a);
    }
  },
}));

import { AuthController } from '../auth/application/authController.js';
import { TokenService } from '../services/tokenService.js';
import { CookieService } from '../services/cookieServices.js';

const usuarioFila = {
  id_usuario: 7,
  codigo_usuario: 'U7',
  nombre: 'Ana',
  apellido: 'Pérez',
  email: 'ana@x.com',
  rol: 'estudiante',
};

describe('AuthController.refrescarSesion (rotación, ADR-0028)', () => {
  let req, res, controller;

  beforeEach(() => {
    controller = new AuthController();
    req = { cookies: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it('devuelve 401 si no hay refresh token', async () => {
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No refresh token provided',
    });
  });

  it('devuelve 401 si el refresh token es inválido', async () => {
    req.cookies.refreshToken = 'bad';
    TokenService.verifyRefreshToken.mockReturnValue(null);
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' });
  });

  it('devuelve 401 si el token no es de tipo refresh', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({
      id: 1,
      type: 'access',
      jti: 'j1',
    });
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devuelve 401 si falta el jti', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({ id: 1, type: 'refresh' });
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devuelve 401 si el jti no existe en BD', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({
      id: 7,
      type: 'refresh',
      jti: 'jti-x',
    });
    obtenerRefreshToken.mockResolvedValue(null);
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' });
  });

  it('DETECCIÓN DE REÚSO: si el jti está revocado, revoca toda la cadena y 401', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({
      id: 7,
      type: 'refresh',
      jti: 'jti-old',
    });
    obtenerRefreshToken.mockResolvedValue({ jti: 'jti-old', revocado: true });
    await controller.refrescarSesion(req, res);
    expect(revocarTodosRefreshTokensDeUsuario).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Refresh token reuse detected',
    });
  });

  it('devuelve 401 si el usuario ya no existe', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({
      id: 99,
      type: 'refresh',
      jti: 'jti-ok',
    });
    obtenerRefreshToken.mockResolvedValue({ jti: 'jti-ok', revocado: false });
    obtenerUsuarioPorId.mockResolvedValue(null);
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' });
  });

  it('ROTA: emite tokens nuevos, persiste y revoca el usado, 200 con el usuario', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({
      id: 7,
      type: 'refresh',
      jti: 'jti-old',
    });
    obtenerRefreshToken.mockResolvedValue({ jti: 'jti-old', revocado: false });
    obtenerUsuarioPorId.mockResolvedValue(usuarioFila);

    await controller.refrescarSesion(req, res);

    expect(TokenService.generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, userCode: 'U7', role: 'estudiante' })
    );
    // Persistió el nuevo refresh token y revocó el viejo enlazándolo.
    expect(guardarRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ jti: 'jti-new', idUsuario: 7 })
    );
    expect(revocarRefreshToken).toHaveBeenCalledWith('jti-old', 'jti-new');
    // Reemite ambas cookies (access + refresh nuevo).
    expect(CookieService.setTokenCookies).toHaveBeenCalledWith(
      res,
      'newAccess',
      'newRefresh'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, userCode: 'U7', role: 'estudiante' })
    );
  });

  it('devuelve 500 ante un error inesperado', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({
      id: 7,
      type: 'refresh',
      jti: 'jti-old',
    });
    obtenerRefreshToken.mockRejectedValue(new Error('db down'));
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
