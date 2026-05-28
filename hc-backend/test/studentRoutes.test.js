import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('studentRoutes', () => {
  const app = express();
  app.use(express.json());
  // Mock middleware y controller
  const authMiddleware = vi.fn((req, res, next) => next());
  const getAdultPatientsByStudentId = vi.fn((req, res) =>
    res.json({ adults: true })
  );
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/:id/patients/adult', getAdultPatientsByStudentId);
  app.use('/api/students', router);

  beforeEach(() => {
    authMiddleware.mockClear();
    getAdultPatientsByStudentId.mockClear();
  });

  it('GET /api/students/:id/patients/adult should call getAdultPatientsByStudentId', async () => {
    const res = await request(app).get('/api/students/1/patients/adult');
    expect(res.body).toEqual({ adults: true });
    expect(res.status).toBe(200);
    expect(authMiddleware).toHaveBeenCalled();
    expect(getAdultPatientsByStudentId).toHaveBeenCalled();
  });
});
