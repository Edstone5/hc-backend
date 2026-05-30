import { Router } from 'express';
import { EquipoController } from '../equipo/application/equipoController.js';
import { PrestamoEquipoController } from '../prestamoEquipo/application/prestamoEquipoController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

export const equipoRoutes = Router();
equipoRoutes.use(authMiddleware);

equipoRoutes.get('/', EquipoController.listar);
equipoRoutes.post('/', EquipoController.registrar);
equipoRoutes.put('/:id', EquipoController.actualizar);

equipoRoutes.get('/prestamos', PrestamoEquipoController.listar);
equipoRoutes.post('/prestamos', PrestamoEquipoController.registrar);
equipoRoutes.patch(
  '/prestamos/:id/devolver',
  PrestamoEquipoController.devolver
);
