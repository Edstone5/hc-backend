import { Router } from 'express';
import { userRoutes } from './userRoutes.js';
import { patientRoutes } from './patientRoutes.js';
import { hcRoutes } from './hcRoutes.js';
import { studentRoutes } from './studentRoutes.js';
import { studentUsersRoutes } from './studentUsersRoutes.js';
import catalogoRoutes from './catalogo.js';

export const router = Router();

router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
router.use('/hc', hcRoutes);
router.use('/students', studentRoutes);
router.use('/student-users', studentUsersRoutes);
router.use('/catalogo', catalogoRoutes);
