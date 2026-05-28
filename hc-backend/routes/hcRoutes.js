import { Router } from 'express';
import { HcController } from '../controllers/hc/hcController.js';
import { HcModel } from '../models/hc/hcModel.js';
import { listaHcAdultos } from '../controllers/hc/hcController/listaHcAdultos.js';
import * as examenGeneralController from '../controllers/hc/examenFisico/examenGeneralController.js';
import * as examenRegionalController from '../controllers/hc/examenFisico/examenRegionalController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import * as motivoConsultaController from '../controllers/hc/anamnesis/motivoConsultaController.js';
import * as antecedentePersonalController from '../controllers/hc/anamnesis/antecedenteController.js';
import * as enfermedadActualController from '../controllers/hc/anamnesis/enfermedadActualController.js';
import * as filiacionController from '../controllers/hc/anamnesis/filiacionController.js';

export const hcRoutes = Router();

const hcController = new HcController(HcModel);

hcRoutes.use(authMiddleware);

// Endpoints motivo_consulta
hcRoutes.post(
  '/motivo-consulta',
  motivoConsultaController.createMotivoConsulta
);
hcRoutes.get(
  '/motivo-consulta/historia/:id_historia',
  motivoConsultaController.getMotivoConsulta
);
hcRoutes.put(
  '/motivo-consulta/historia/:id_historia',
  motivoConsultaController.updateMotivoConsulta
);

// Endpoints antecedente_personal
hcRoutes.post(
  '/antecedente-personal',
  antecedentePersonalController.createAntecedentePersonal
);
hcRoutes.get(
  '/antecedente-personal/historia/:id_historia',
  antecedentePersonalController.getAntecedentePersonal
);
hcRoutes.put(
  '/antecedente-personal/historia/:id_historia',
  antecedentePersonalController.updateAntecedentePersonal
);
// Endpoints antecedente_medico
hcRoutes.post(
  '/antecedente-medico',
  antecedentePersonalController.createAntecedenteMedico
);
hcRoutes.get(
  '/antecedente-medico/historia/:id_historia',
  antecedentePersonalController.getAntecedenteMedico
);
hcRoutes.put(
  '/antecedente-medico/historia/:id_historia',
  antecedentePersonalController.updateAntecedenteMedico
);
// Endpoints antecedente_familiar
hcRoutes.post(
  '/antecedente-familiar',
  antecedentePersonalController.createAntecedenteFamiliar
);
hcRoutes.get(
  '/antecedente-familiar/historia/:id_historia',
  antecedentePersonalController.getAntecedenteFamiliar
);
hcRoutes.put(
  '/antecedente-familiar/historia/:id_historia',
  antecedentePersonalController.updateAntecedenteFamiliar
);
// Endpoints antecedente_cumplimiento
hcRoutes.post(
  '/antecedente-cumplimiento',
  antecedentePersonalController.createAntecedenteCumplimiento
);
hcRoutes.get(
  '/antecedente-cumplimiento/historia/:id_historia',
  antecedentePersonalController.getAntecedenteCumplimiento
);
hcRoutes.put(
  '/antecedente-cumplimiento/historia/:id_historia',
  antecedentePersonalController.updateAntecedenteCumplimiento
);

// Endpoints enfermedad_actual
hcRoutes.post(
  '/enfermedad-actual',
  enfermedadActualController.createEnfermedadActual
);
hcRoutes.get(
  '/enfermedad-actual/historia/:id_historia',
  enfermedadActualController.getEnfermedadActual
);
hcRoutes.put(
  '/enfermedad-actual/historia/:id_historia',
  enfermedadActualController.updateEnfermedadActual
);

// Endpoints filiacion
hcRoutes.post('/filiacion', filiacionController.createFiliacion);
hcRoutes.get(
  '/filiacion/historia/:id_historia',
  filiacionController.getFiliacion
);
hcRoutes.put(
  '/filiacion/historia/:id_historia',
  filiacionController.updateFiliacion
);

hcRoutes.get('/:id/patient', hcController.getPatientByHistory);

hcRoutes.post('/review', hcController.createReview);

// Nuevas rutas para el flujo de borrador
hcRoutes.post('/draft', hcController.createDraft);
hcRoutes.patch('/assign-patient', hcController.assignPatient);
// Endpoint para registrar una historia clínica
hcRoutes.post('/register', hcController.registerHc);
// Nuevo endpoint para asignar alumno a una historia clínica

// --- RUTAS DE EXAMEN FÍSICO GENERAL ---

// Endpoints examen general
hcRoutes.post('/examen-general', examenGeneralController.createExamenGeneral);
hcRoutes.get(
  '/examen-general/historia/:id_historia',
  examenGeneralController.getExamenGeneral
);
hcRoutes.put(
  '/examen-general/historia/:id_historia',
  examenGeneralController.updateExamenGeneral
);

// Endpoints examen regional
hcRoutes.post(
  '/examen-regional',
  examenRegionalController.createExamenRegional
);
hcRoutes.get(
  '/examen-regional/historia/:id_historia',
  examenRegionalController.getExamenRegional
);
hcRoutes.put(
  '/examen-regional/historia/:id_historia',
  examenRegionalController.updateExamenRegional
);

// --- RUTAS DE EXAMEN FÍSICO GENERAL ---
hcRoutes.get('/:id/examen-general', hcController.getGeneralExam);
hcRoutes.put('/:id/examen-general', hcController.updateGeneralExam);

// --- RUTAS DE EXAMEN REGIONAL (CABEZA, ATM, CUELLO) ---
hcRoutes.get('/:id/examen-regional', hcController.getRegionalExam);
hcRoutes.put('/:id/examen-regional', hcController.updateRegionalExam);

// --- RUTAS DE EXAMEN CLÍNICO DE LA BOCA ---
hcRoutes.get('/:id/examen-boca', hcController.getExamBoca);
hcRoutes.put('/:id/examen-boca', hcController.updateExamBoca);

// --- RUTAS DE HIGIENE BUCAL ---
hcRoutes.get('/:id/higiene', hcController.getHigieneOral);
hcRoutes.put('/:id/higiene', hcController.updateHigieneOral);

// SECCIÓN III
hcRoutes.get(
  '/:id/diagnostico-presuntivo',
  hcController.getDiagnosticoPresuntivo
);
hcRoutes.put(
  '/:id/diagnostico-presuntivo',
  hcController.updateDiagnosticoPresuntivo
);

// SECCIÓN IV
hcRoutes.get('/:id/derivacion', hcController.getDerivacion);
hcRoutes.put('/:id/derivacion', hcController.updateDerivacion);

// SECCIÓN V
hcRoutes.get('/:id/diagnostico-clinicas', hcController.getDiagnosticoClinicas);
hcRoutes.put(
  '/:id/diagnostico-clinicas',
  hcController.updateDiagnosticoClinicas
);

// --- RUTAS DE EVOLUCIÓN ---
hcRoutes.get('/:id/evolucion', hcController.getEvolucion);
hcRoutes.post('/:id/evolucion', hcController.addEvolucion);

// Endpoint para obtener todas las historias clínicas de un estudiante
hcRoutes.get('/student/:id', hcController.getAllByStudentId);
// Endpoint para obtener historias clínicas adultas de un estudiante específico
hcRoutes.get('/student/:id/adult-historias', listaHcAdultos);
