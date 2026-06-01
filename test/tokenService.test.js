import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { TokenService } from '../services/tokenService.js';

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(function () {
      return 'token';
    }),
    verify: vi.fn(function () {
      return { id: 1 };
    }),
  },
}));

describe('TokenService', () => {
  const user = { id: 1, userCode: 'U1234567890', role: 'admin' };

  it('generateAccessToken calls jwt.sign with correct args', () => {
    const token = TokenService.generateAccessToken(user);
    expect(token).toBe('token');
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        userCode: 'U1234567890',
        role: 'admin',
      }),
      expect.anything(),
      expect.objectContaining({ expiresIn: '15m' })
    );
  });

  it('generateRefreshToken devuelve { token, jti, expiraEn } y firma con jti', () => {
    TokenService.generateAccessToken(user); // llamada previa
    const result = TokenService.generateRefreshToken(user);
    expect(result.token).toBe('token');
    expect(typeof result.jti).toBe('string');
    expect(result.jti.length).toBeGreaterThan(0);
    expect(result.expiraEn instanceof Date).toBe(true);
    // Busca la llamada con los argumentos esperados (incluye jti y type refresh)
    const found = jwt.sign.mock.calls.some(
      (call) =>
        call[0].id === 1 &&
        call[0].type === 'refresh' &&
        typeof call[0].jti === 'string' &&
        call[2] &&
        call[2].expiresIn === '7d'
    );
    expect(found).toBe(true);
  });

  it('verifyAccessToken calls jwt.verify', () => {
    const result = TokenService.verifyAccessToken('token');
    expect(result).toEqual({ id: 1 });
    expect(jwt.verify).toHaveBeenCalledWith('token', expect.anything());
  });
});
