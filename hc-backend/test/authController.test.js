import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../controllers/users/authController.js';

vi.mock('../services/tokenService.js', () => ({
  TokenService: {
    generateAccessToken: vi.fn(() => 'access'),
    generateRefreshToken: vi.fn(() => 'refresh'),
  },
}));
vi.mock('../services/cookieServices.js', () => ({
  CookieService: {
    setTokenCookies: vi.fn(),
  },
}));

import { TokenService } from '../services/tokenService.js';
import { CookieService } from '../services/cookieServices.js';

describe('AuthController', () => {
  let req, res, userModel, controller;

  beforeEach(() => {
    userModel = {
      login: vi.fn(),
    };
    controller = new AuthController(userModel);
    req = { body: {}, user: { id: 1, name: 'Test' } };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should return 400 if missing credentials', async () => {
      req.body = {};
      await controller.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing credentials' });
    });
    it('should return 401 if user not found', async () => {
      req.body = { userCode: 'a', password: 'b' };
      userModel.login.mockResolvedValue(null);
      await controller.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
    it('should return 200 and set tokens on success', async () => {
      req.body = { userCode: 'a', password: 'b' };
      const user = {
        id: 1,
        userCode: 'a',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        role: 'admin',
      };
      userModel.login.mockResolvedValue(user);
      await controller.login(req, res);
      expect(TokenService.generateAccessToken).toHaveBeenCalledWith(user);
      expect(TokenService.generateRefreshToken).toHaveBeenCalledWith(user);
      expect(CookieService.setTokenCookies).toHaveBeenCalledWith(
        res,
        'access',
        'refresh'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: user.id,
        userCode: user.userCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });
    });
    it('should return 500 on error', async () => {
      req.body = { userCode: 'a', password: 'b' };
      userModel.login.mockRejectedValue(new Error('fail'));
      await controller.login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getCurrentUser', () => {
    it('should return 200 and user from req', async () => {
      await controller.getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(req.user);
    });
  });
});
