import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de servicios y repositorio antes de importar el controlador DDD.
vi.mock('../services/tokenService.js', () => ({
  TokenService: {
    generateAccessToken: vi.fn(() => 'newAccess'),
    generateRefreshToken: vi.fn(() => 'newRefresh'),
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
vi.mock('../auth/infrastructure/authRepository.js', () => ({
  AuthRepository: class {
    obtenerUsuarioPorId(...args) {
      return obtenerUsuarioPorId(...args);
    }
  },
}));

import { AuthController } from '../auth/application/authController.js';
import { TokenService } from '../services/tokenService.js';
import { CookieService } from '../services/cookieServices.js';

describe('AuthController.refrescarSesion', () => {
  let req, res, controller;

  beforeEach(() => {
    controller = new AuthController();
    req = { cookies: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
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
    TokenService.verifyRefreshToken.mockReturnValue({ id: 1, type: 'access' });
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('devuelve 401 si el usuario ya no existe', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({
      id: 99,
      type: 'refresh',
    });
    obtenerUsuarioPorId.mockResolvedValue(null);
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' });
  });

  it('reemite el access token y devuelve 200 con el usuario', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({ id: 7, type: 'refresh' });
    obtenerUsuarioPorId.mockResolvedValue({
      id_usuario: 7,
      codigo_usuario: 'U7',
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@x.com',
      rol: 'estudiante',
    });

    await controller.refrescarSesion(req, res);

    expect(TokenService.generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, userCode: 'U7', role: 'estudiante' })
    );
    expect(CookieService.setAccessCookie).toHaveBeenCalledWith(
      res,
      'newAccess'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, userCode: 'U7', role: 'estudiante' })
    );
  });

  it('devuelve 500 ante un error inesperado', async () => {
    req.cookies.refreshToken = 'x';
    TokenService.verifyRefreshToken.mockReturnValue({ id: 7, type: 'refresh' });
    obtenerUsuarioPorId.mockRejectedValue(new Error('db down'));
    await controller.refrescarSesion(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
