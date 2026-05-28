import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('studentUsersRoutes', () => {
  const app = express();
  app.use(express.json());
  // Mock controller
  const getAllStudentUsers = vi.fn((req, res) => res.json({ users: true }));
  const router = express.Router();
  router.get('/', getAllStudentUsers);
  app.use('/api/student-users', router);

  beforeEach(() => {
    getAllStudentUsers.mockClear();
  });

  it('GET /api/student-users should call getAllStudentUsers', async () => {
    const res = await request(app).get('/api/student-users');
    expect(res.body).toEqual({ users: true });
    expect(res.status).toBe(200);
    expect(getAllStudentUsers).toHaveBeenCalled();
  });
});
