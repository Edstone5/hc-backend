import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { router } from './routes/index.js';
import { healthRouter } from './routes/healthRoutes.js';
import { metricsRouter } from './routes/metricsRoutes.js';
import { prometheusMiddleware } from './middlewares/prometheusMiddleware.js';
import { auditoriaMiddleware } from './middlewares/auditoriaMW.js';

const app = express();

// Para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://edstone5.github.io',
    'https://hc-frontend-18qd.onrender.com',
    'http://161.132.4.46',
    'http://unjbghc.duckdns.org',
    'https://unjbghc.duckdns.org',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
// Manejar explícitamente solicitudes OPTIONS (preflight)
//app.options('*', cors(corsOptions));

app.use(cookieParser());

app.disable('x-powered-by');
app.use(express.json());

// ── SRE: instrumentación Prometheus (antes de las rutas de negocio) ───────────
app.use(prometheusMiddleware);

// ── Auditoría: registra mutaciones autenticadas en tabla `auditoria` ──────────
app.use(auditoriaMiddleware);

// ── SRE: endpoints de observabilidad (sin prefijo /api para que los scrapers
//         de Prometheus y los health-checks de Docker accedan directamente) ────
app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);

// Swagger/OpenAPI configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Historia Clínica — UNJBG',
      version: '2.0.0',
      description: [
        'REST API del sistema de Historia Clínica de la UNJBG.',
        '',
        '**Autenticación**: cookie `accessToken` (JWT). ',
        'Inicia sesión en `POST /api/auth/login` para obtenerla.',
        '',
        '**Observabilidad**: `/health` (liveness probe) y `/metrics` (Prometheus).',
      ].join('\n'),
      contact: { name: 'Equipo HC-UNJBG' },
      license: { name: 'ISC' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Desarrollo local' },
      { url: 'http://unjbghc.duckdns.org', description: 'Producción' },
    ],
    // Seguridad global: todas las rutas requieren cookieAuth salvo que
    // el endpoint individual lo sobreescriba con `security: []`
    security: [{ cookieAuth: [] }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description:
            'Cookie HttpOnly establecida por `POST /api/users/login`. ' +
            'Se envía automáticamente con cada petición del navegador.',
        },
      },
      schemas: {
        HealthOk: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            uptime_ms: { type: 'integer', example: 12345 },
            timestamp: { type: 'string', format: 'date-time' },
            db: { type: 'string', example: 'connected' },
            version: { type: 'string', example: '2.0.0' },
          },
        },
        HealthError: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            uptime_ms: { type: 'integer', example: 12345 },
            timestamp: { type: 'string', format: 'date-time' },
            db: { type: 'string', example: 'disconnected' },
          },
        },
      },
    },
  },
  apis: [
    // Autenticación, usuarios, pacientes, HC core
    './docs/authEndpoints.js',
    './docs/patientEndpoints.js',
    './docs/hcCoreEndpoints.js',
    './docs/borradorEndpoints.js',
    // Anamnesis
    './docs/antecedente.js',
    './docs/swagger-endpoints.js',
    // Exámenes
    './docs/examenes.js',
    './docs/examenesEndpoints.js',
    // Secciones, estudiantes, catálogo
    './docs/seccionesEndpoints.js',
    './docs/estudiantesEndpoints.js',
    './docs/catalogoEndpoints.js',
    // Rutas (captura @swagger de healthRoutes.js y metricsRoutes.js)
    './routes/*.js',
  ],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Servir la carpeta coverage como recurso estático en /api/coverage
app.use('/api/coverage', express.static(path.join(__dirname, 'coverage')));

app.use('/api', router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // console.log(`Server is running on port ${PORT}`);
  // Use a logger here if available
});
