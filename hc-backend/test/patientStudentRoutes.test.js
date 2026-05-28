import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('patientRoutes', () => {
  const app = express();
  app.use(express.json());
  // Mock controller
  const createPatient = vi.fn((req, res) =>
    res.status(201).json({ created: true })
  );
  const updatePatient = vi.fn((req, res) =>
    res.status(200).json({ updated: true })
  );
  const router = express.Router();
  router.post('/', createPatient);
  router.put('/:id', updatePatient);
  app.use('/api/pacientes', router);

  beforeEach(() => {
    createPatient.mockClear();
    updatePatient.mockClear();
  });

  it('POST /api/pacientes should call createPatient', async () => {
    const res = await request(app).post('/api/pacientes').send({});
    expect(res.body).toEqual({ created: true });
    expect(res.status).toBe(201);
    expect(createPatient).toHaveBeenCalled();
  });

  it('PUT /api/pacientes/:id should call updatePatient', async () => {
    const res = await request(app).put('/api/pacientes/123').send({});
    expect(res.body).toEqual({ updated: true });
    expect(res.status).toBe(200);
    expect(updatePatient).toHaveBeenCalled();
  });
});

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
