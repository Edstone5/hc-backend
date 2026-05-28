import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { UserController } from '../controllers/users/userController.js';

vi.mock('../schemas/passwdSchema.js', () => ({
  validatePasswd: vi.fn((pw) => {
    if (pw === 'valid') {
      return { success: true };
    }
    return {
      success: false,
      error: {
        message: JSON.stringify([
          { message: 'La contraseña debe tener al menos 8 caracteres' },
          {
            message: 'La contraseña debe contener al menos una letra mayúscula',
          },
          { message: 'La contraseña debe contener al menos un número' },
          {
            message:
              'La contraseña debe contener al menos un carácter especial',
          },
        ]),
      },
    };
  }),
}));

// Mock the userModel
vi.mock('../../models/user/userModel.js');
vi.mock('jsonwebtoken');

describe('UserController', () => {
  let req, res, userModel, controller;

  beforeEach(() => {
    userModel = {
      getAll: vi.fn(),
      register: vi.fn(),
      login: vi.fn(),
      getUserById: vi.fn(),
    };
    controller = new UserController(userModel);
    req = { body: {}, params: {}, user: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it('getAll should return users', async () => {
    userModel.getAll.mockResolvedValue(['a']);
    await controller.getAll(req, res);
    expect(res.json).toHaveBeenCalledWith(['a']);
  });

  describe('register', () => {
    it('should return 400 if password invalid', async () => {
      req.body = { password: 'bad' };
      await controller.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: [
          'La contraseña debe tener al menos 8 caracteres',
          'La contraseña debe contener al menos una letra mayúscula',
          'La contraseña debe contener al menos un número',
          'La contraseña debe contener al menos un carácter especial',
        ],
      });
    });
    it('should return 201 on success', async () => {
      req.body = { password: 'valid' };
      userModel.register.mockResolvedValue({ id: 1 });
      await controller.register(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });
    it('should return 400 if register fails', async () => {
      req.body = { password: 'valid' };
      userModel.register.mockResolvedValue(null);
      await controller.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error registering user',
      });
    });
  });

  describe('login', () => {
    it('should return 401 if user not found', async () => {
      req.body = { userCode: 'a', password: 'b' };
      userModel.login.mockResolvedValue(null);
      await controller.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
    it('should return 200 and token on success', async () => {
      req.body = { userCode: 'a', password: 'b' };
      userModel.login.mockResolvedValue({ id: 1 });
      await controller.login(req, res);
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('getUserById', () => {
    it('should return 404 if not found', async () => {
      req.params.id = '1';
      userModel.getUserById.mockResolvedValue(null);
      await controller.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado',
      });
    });
    it('should return 200 and user if found', async () => {
      req.params.id = '1';
      userModel.getUserById.mockResolvedValue({ id: 1 });
      await controller.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 },
      });
    });
  });
});
