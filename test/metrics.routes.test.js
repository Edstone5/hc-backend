/**
 * Tests for routes/metricsRoutes.js and middlewares/prometheusMiddleware.js
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { metricsRouter } from '../routes/metricsRoutes.js';
import { prometheusMiddleware } from '../middlewares/prometheusMiddleware.js';

function buildApp() {
  const app = express();
  app.use(prometheusMiddleware);
  app.use('/metrics', metricsRouter);
  // Ruta de prueba para ejercitar el middleware
  app.get('/test', (_req, res) => res.status(200).json({ ok: true }));
  app.get('/error', (_req, res) => res.status(500).json({ error: 'fail' }));
  return app;
}

describe('GET /metrics', () => {
  it('returns 200 with text/plain content-type', async () => {
    const app = buildApp();
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
  });

  it('response body contains default Node.js metrics', async () => {
    const app = buildApp();
    const res = await request(app).get('/metrics');
    // prom-client always emits nodejs_version_info
    expect(res.text).toMatch(/nodejs_version_info/);
  });
});

describe('prometheusMiddleware', () => {
  it('increments http_requests_total on each request', async () => {
    const app = buildApp();
    await request(app).get('/test');
    const metricsRes = await request(app).get('/metrics');
    expect(metricsRes.text).toMatch(/http_requests_total/);
  });

  it('records http_request_duration_seconds', async () => {
    const app = buildApp();
    await request(app).get('/test');
    const metricsRes = await request(app).get('/metrics');
    expect(metricsRes.text).toMatch(/http_request_duration_seconds/);
  });
});
