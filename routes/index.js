import { Router } from 'express';
import { userRoutes } from './userRoutes.js';
import { patientRoutes } from './patientRoutes.js';
import { hcRoutes } from './hcRoutes.js';
import { studentRoutes } from './studentRoutes.js';
import { studentUsersRoutes } from './studentUsersRoutes.js';
import catalogoRoutes from './catalogo.js';
import { equipoRoutes } from './equipoRoutes.js';
import { notificacionRoutes } from './notificacionRoutes.js';
import { reporteRoutes } from './reporteRoutes.js';

export const router = Router();

router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
router.use('/hc', hcRoutes);
router.use('/students', studentRoutes);
router.use('/student-users', studentUsersRoutes);
router.use('/catalogo', catalogoRoutes);

// Nuevos módulos — Fases 2-5
router.use('/equipos', equipoRoutes);
router.use('/notificaciones', notificacionRoutes);
router.use('/reportes', reporteRoutes);
