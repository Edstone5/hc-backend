/**
 * GET /health
 *
 * SRE — Liveness y readiness probe.
 * Usado por Docker, Kubernetes, load balancers y Prometheus
 * para verificar que el servicio responde correctamente.
 *
 * Responde 200 si el proceso está vivo y tiene conexión a la BD,
 * 503 si la BD no responde.
 */
import { Router } from 'express';
import pool from '../db/db.js';

export const healthRouter = Router();

const startTime = Date.now();

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Observabilidad
 *     summary: Liveness & readiness probe
 *     security: []
 *     description: >
 *       Verifica que el servidor está activo y puede conectarse a la base de
 *       datos MySQL. Apto para usar como healthcheck en Docker Compose,
 *       Kubernetes o cualquier load balancer.
 *     responses:
 *       200:
 *         description: Servicio operativo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthOk'
 *       503:
 *         description: Base de datos no disponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthError'
 */
healthRouter.get('/', async (_req, res) => {
  const uptimeMs = Date.now() - startTime;

  try {
    await pool.query('SELECT 1');

    return res.status(200).json({
      status: 'ok',
      uptime_ms: uptimeMs,
      timestamp: new Date().toISOString(),
      db: 'connected',
      version: process.env.npm_package_version ?? '1.0.0',
    });
  } catch {
    return res.status(503).json({
      status: 'error',
      uptime_ms: uptimeMs,
      timestamp: new Date().toISOString(),
      db: 'disconnected',
    });
  }
});
