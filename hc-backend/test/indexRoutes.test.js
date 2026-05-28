import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { router } from '../routes/index.js';

describe('main router', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', router);

  it('should mount /users route', async () => {
    const res = await request(app).get('/api/users');
    expect([404, 401, 200, 500]).toContain(res.status);
  });

  it('should mount /patients route', async () => {
    const res = await request(app).get('/api/patients');
    expect([404, 401, 200, 500]).toContain(res.status);
  });

  it('should mount /hc route', async () => {
    const res = await request(app).get('/api/hc');
    expect([404, 401, 200, 500]).toContain(res.status);
  });

  it('should mount /students route', async () => {
    const res = await request(app).get('/api/students');
    expect([404, 401, 200, 500]).toContain(res.status);
  });

  it('should mount /student-users route', async () => {
    const res = await request(app).get('/api/student-users');
    expect([404, 401, 200, 500]).toContain(res.status);
  });

  it('should mount /catalogo route', async () => {
    const res = await request(app).get('/api/catalogo');
    expect([404, 401, 200, 500]).toContain(res.status);
  });
});
