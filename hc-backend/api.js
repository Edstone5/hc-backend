import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { router } from './routes/index.js';

const app = express();

// Para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://vaquitamarina.github.io',
      'http://161.132.4.46',
      'http://unjbghc.duckdns.org',
      'https://unjbghc.duckdns.org',
    ],
    credentials: true,
  })
);

app.use(cookieParser());

app.disable('x-powered-by');
app.use(express.json());

// Swagger/OpenAPI configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Historia Clínica',
      version: '1.0.0',
      description: 'Documentación de la API interna',
    },
  },
  apis: [
    './docs/swagger-endpoints.js',
    './docs/antecedente.js',
    './docs/examenes.js',
    './docs/examenesEndpoints.js',
    './docs/seccionesEndpoints.js',
    './docs/estudiantesEndpoints.js',
    './docs/borradorEndpoints.js',
    './docs/catalogoEndpoints.js',
    './routes/*.js',
  ], // Incluye los archivos de documentación aparte
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
