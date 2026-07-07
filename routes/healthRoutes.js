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

/**
 * GET /health/live — Liveness probe (SWEBOK v4: adaptador de salud).
 *
 * Responde 200 mientras el proceso Node.js esté vivo. NO consulta la base de
 * datos a propósito: una caída de la BD no debe provocar el reinicio del pod
 * (reiniciar no arregla una BD caída); esa condición la gobierna readiness.
 *
 * @swagger
 * /health/live:
 *   get:
 *     tags: [Observabilidad]
 *     summary: Liveness probe (proceso vivo)
 *     security: []
 *     responses:
 *       200:
 *         description: El proceso está vivo
 */
healthRouter.get('/live', (_req, res) => {
  return res.status(200).json({
    status: 'alive',
    uptime_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready — Readiness probe (SWEBOK v4: adaptador de salud).
 *
 * Responde 200 solo si el dominio está listo para recibir tráfico, es decir,
 * si el adaptador de persistencia (MySQL) responde. Si la BD no está
 * disponible devuelve 503: Kubernetes retira el pod de los endpoints del
 * Service sin matarlo, y la caída del SLO queda observable en Prometheus.
 *
 * @swagger
 * /health/ready:
 *   get:
 *     tags: [Observabilidad]
 *     summary: Readiness probe (dominio listo para tráfico)
 *     security: []
 *     responses:
 *       200:
 *         description: Listo (BD conectada)
 *       503:
 *         description: No listo (BD no disponible)
 */
healthRouter.get('/ready', async (_req, res) => {
  const uptimeMs = Date.now() - startTime;
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'ready',
      uptime_ms: uptimeMs,
      timestamp: new Date().toISOString(),
      db: 'connected',
    });
  } catch {
    return res.status(503).json({
      status: 'not_ready',
      uptime_ms: uptimeMs,
      timestamp: new Date().toISOString(),
      db: 'disconnected',
    });
  }
});
