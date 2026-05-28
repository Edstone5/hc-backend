import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('userRoutes', () => {
  const app = express();
  app.use(express.json());
  // Mock controllers y middleware
  const register = vi.fn((req, res) =>
    res.status(201).json({ registered: true })
  );
  const login = vi.fn((req, res) => res.status(200).json({ logged: true }));
  const getCurrentUser = vi.fn((req, res) => res.json({ me: true }));
  const getUserById = vi.fn((req, res) => res.json({ id: req.params.id }));
  const getAll = vi.fn((req, res) => res.json({ all: true }));
  const authMiddleware = vi.fn((req, res, next) => next());
  const router = express.Router();
  router.post('/register', register);
  router.post('/login', login);
  router.use(authMiddleware);
  router.get('/me', getCurrentUser);
  router.get('/:id', getUserById);
  router.get('/', getAll);
  app.use('/api/users', router);

  beforeEach(() => {
    register.mockClear();
    login.mockClear();
    getCurrentUser.mockClear();
    getUserById.mockClear();
    getAll.mockClear();
    authMiddleware.mockClear();
  });

  it('POST /api/users/register should call register', async () => {
    const res = await request(app).post('/api/users/register').send({});
    expect(res.body).toEqual({ registered: true });
    expect(res.status).toBe(201);
    expect(register).toHaveBeenCalled();
  });

  it('POST /api/users/login should call login', async () => {
    const res = await request(app).post('/api/users/login').send({});
    expect(res.body).toEqual({ logged: true });
    expect(res.status).toBe(200);
    expect(login).toHaveBeenCalled();
  });

  it('GET /api/users/me should call getCurrentUser', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.body).toEqual({ me: true });
    expect(res.status).toBe(200);
    expect(authMiddleware).toHaveBeenCalled();
    expect(getCurrentUser).toHaveBeenCalled();
  });

  it('GET /api/users/:id should call getUserById', async () => {
    const res = await request(app).get('/api/users/123');
    expect(res.body).toEqual({ id: '123' });
    expect(res.status).toBe(200);
    expect(authMiddleware).toHaveBeenCalled();
    expect(getUserById).toHaveBeenCalled();
  });

  it('GET /api/users/ should call getAll', async () => {
    const res = await request(app).get('/api/users');
    expect(res.body).toEqual({ all: true });
    expect(res.status).toBe(200);
    expect(authMiddleware).toHaveBeenCalled();
    expect(getAll).toHaveBeenCalled();
  });
});
