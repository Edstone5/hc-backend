/**
 * Tests for routes/healthRoutes.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock db/db.js before importing the route
vi.mock('../db/db.js', () => ({
  default: { query: vi.fn() },
}));

import { healthRouter } from '../routes/healthRoutes.js';
import pool from '../db/db.js';

function buildApp() {
  const app = express();
  app.use('/health', healthRouter);
  return app;
}

describe('GET /health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with status ok when DB is connected', async () => {
    pool.query.mockResolvedValue({ rows: [{ 1: 1 }] });
    const app = buildApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body).toHaveProperty('uptime_ms');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('returns 503 with status error when DB is down', async () => {
    pool.query.mockRejectedValue(new Error('Connection refused'));
    const app = buildApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.db).toBe('disconnected');
  });
});
