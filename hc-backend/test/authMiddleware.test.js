import { describe, it, expect, vi, beforeEach } from 'vitest';
import authMiddleware from '../middlewares/authMiddleware.js';
import { TokenService } from '../services/tokenService.js';

describe('authMiddleware', () => {
  const next = vi.fn();
  let req, res;

  beforeEach(() => {
    req = { cookies: {}, user: undefined };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next.mockClear();
    vi.clearAllMocks();
  });

  it('should return 401 if no token', async () => {
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    req.cookies.accessToken = 'invalid';
    vi.spyOn(TokenService, 'verifyAccessToken').mockReturnValue(null);
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next if token is valid', async () => {
    req.cookies.accessToken = 'valid';
    vi.spyOn(TokenService, 'verifyAccessToken').mockReturnValue({
      id: 1,
      userCode: 'U1',
      role: 'admin',
    });
    await authMiddleware(req, res, next);
    expect(req.user).toEqual({ id: 1, userCode: 'U1', role: 'admin' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(401);
  });

  it('should return 500 on unexpected error', async () => {
    req.cookies.accessToken = 'valid';
    vi.spyOn(TokenService, 'verifyAccessToken').mockImplementation(() => {
      throw new Error('fail');
    });
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(next).not.toHaveBeenCalled();
  });
});
