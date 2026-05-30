import { Router } from 'express';
import { ReporteController } from '../reporte/application/reporteController.js';
import { AuditoriaController } from '../auditoria/application/auditoriaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

export const reporteRoutes = Router();
reporteRoutes.use(authMiddleware);

reporteRoutes.get('/admin', ReporteController.resumenAdmin);
reporteRoutes.get('/docente', ReporteController.resumenDocente);
reporteRoutes.get('/anonimo', ReporteController.exportarAnonimo);
reporteRoutes.get('/auditoria', AuditoriaController.listarGeneral);
