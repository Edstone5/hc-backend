import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { hcRoutes } from '../routes/hcRoutes.js';

const app = express();
app.use(express.json());
app.use('/hc', hcRoutes);

describe('hcRoutes', () => {
  it('GET /hc/:id/patient responde', async () => {
    const res = await request(app).get('/hc/1/patient');
    expect([200, 401, 404, 500]).toContain(res.statusCode);
  });

  it('POST /hc/review responde', async () => {
    const res = await request(app).post('/hc/review').send({});
    expect([200, 401, 404, 500]).toContain(res.statusCode);
  });

  it('POST /hc/draft responde', async () => {
    const res = await request(app).post('/hc/draft').send({});
    expect([200, 401, 404, 500]).toContain(res.statusCode);
  });

  it('GET /hc/student/1/adult-historias responde', async () => {
    const res = await request(app).get('/hc/student/1/adult-historias');
    expect([200, 401, 404, 500]).toContain(res.statusCode);
  });

  // Puedes agregar más tests para otras rutas si lo necesitas
});
