import { Router } from 'express';
import { NotificacionController } from '../notificacion/application/notificacionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

export const notificacionRoutes = Router();
notificacionRoutes.use(authMiddleware);

notificacionRoutes.get('/', NotificacionController.listar);
notificacionRoutes.get('/no-leidas', NotificacionController.contarNoLeidas);
notificacionRoutes.patch('/:idNotif/leer', NotificacionController.marcarLeida);
notificacionRoutes.patch(
  '/leer-todas',
  NotificacionController.marcarTodasLeidas
);
