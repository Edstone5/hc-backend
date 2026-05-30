import { Router } from 'express';
import { HcController } from '../hc/application/hcController.js';
import { ListaHcAdultosController } from '../listaHcAdultos/application/listaHcAdultosController.js';
import { ExamenGeneralController } from '../examenGeneral/application/examenGeneralController.js';
import { ExamenRegionalController } from '../examenRegional/application/examenRegionalController.js';
import { ExamenBocaController } from '../examenBoca/application/examenBocaController.js';
import { HigieneBocalController } from '../higieneBocal/application/higieneBocalController.js';
import { DerivacionClinicasController } from '../derivacionClinicas/application/derivacionClinicasController.js';
import { DiagnosticoClinicasController } from '../diagnosticoClinicas/application/diagnosticoClinicasController.js';
import { DiagnosticoPresuntivoController } from '../diagnosticoPresuntivo/application/diagnosticoPresuntivoController.js';
import { EvolucionController } from '../evolucion/application/evolucionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { MotivoConsultaController } from '../motivoConsulta/application/motivoConsultaController.js';
import { AntecedenteController } from '../antecedente/application/antecedenteController.js';
import { EnfermedadActualController } from '../enfermedadActual/application/enfermedadActualController.js';
import { ModuloController } from '../filiacion/application/filiacionController.js';
import { PagoController } from '../pago/application/pagoController.js';
import { OdontogramaController } from '../odontograma/application/odontogramaController.js';
import { PrescripcionController } from '../prescripcion/application/prescripcionController.js';
import {
  AdjuntoController,
  uploadMiddleware,
} from '../adjunto/application/adjuntoController.js';
import { FichaOperacionController } from '../fichaOperacion/application/fichaOperacionController.js';
import { FichaEvaluacionController } from '../fichaEvaluacion/application/fichaEvaluacionController.js';
import { CitaController } from '../cita/application/citaController.js';
import { AuditoriaController } from '../auditoria/application/auditoriaController.js';
import { ConsentimientoController } from '../consentimiento/application/consentimientoController.js';

export const hcRoutes = Router();

const hcController = new HcController();

hcRoutes.use(authMiddleware);

// Endpoints motivo_consulta
hcRoutes.post(
  '/motivo-consulta',
  MotivoConsultaController.registrarMotivoConsulta
);
hcRoutes.get(
  '/motivo-consulta/historia/:id_historia',
  MotivoConsultaController.consultarMotivoConsulta
);
hcRoutes.put(
  '/motivo-consulta/historia/:id_historia',
  MotivoConsultaController.actualizarMotivoConsulta
);

// Endpoints antecedente_personal
hcRoutes.post(
  '/antecedente-personal',
  AntecedenteController.registrarAntecedentesPersonalesNoPatologicos
);
hcRoutes.get(
  '/antecedente-personal/historia/:id_historia',
  AntecedenteController.consultarAntecedentesPersonalesNoPatologicos
);
hcRoutes.put(
  '/antecedente-personal/historia/:id_historia',
  AntecedenteController.actualizarAntecedentesPersonalesNoPatologicos
);
// Endpoints antecedente_medico
hcRoutes.post(
  '/antecedente-medico',
  AntecedenteController.registrarAntecedentesPersonalesPatologicos
);
hcRoutes.get(
  '/antecedente-medico/historia/:id_historia',
  AntecedenteController.consultarAntecedentesPersonalesPatologicos
);
hcRoutes.put(
  '/antecedente-medico/historia/:id_historia',
  AntecedenteController.actualizarAntecedentesPersonalesPatologicos
);
// Endpoints antecedente_familiar
hcRoutes.post(
  '/antecedente-familiar',
  AntecedenteController.registrarAntecedentesHeredoFamiliares
);
hcRoutes.get(
  '/antecedente-familiar/historia/:id_historia',
  AntecedenteController.consultarAntecedentesHeredoFamiliares
);
hcRoutes.put(
  '/antecedente-familiar/historia/:id_historia',
  AntecedenteController.actualizarAntecedentesHeredoFamiliares
);
// Endpoints antecedente_cumplimiento
hcRoutes.post(
  '/antecedente-cumplimiento',
  AntecedenteController.registrarSeguimientoDelTratamiento
);
hcRoutes.get(
  '/antecedente-cumplimiento/historia/:id_historia',
  AntecedenteController.consultarSeguimientoDelTratamiento
);
hcRoutes.put(
  '/antecedente-cumplimiento/historia/:id_historia',
  AntecedenteController.actualizarSeguimientoDelTratamiento
);

// Endpoints enfermedad_actual
hcRoutes.post(
  '/enfermedad-actual',
  EnfermedadActualController.registrarEnfermedadActual
);
hcRoutes.get(
  '/enfermedad-actual/historia/:id_historia',
  EnfermedadActualController.consultarEnfermedadActual
);
hcRoutes.put(
  '/enfermedad-actual/historia/:id_historia',
  EnfermedadActualController.actualizarEnfermedadActual
);

// Endpoints filiacion
hcRoutes.post('/filiacion', ModuloController.registrarDatosPersonalesPaciente);
hcRoutes.get(
  '/filiacion/historia/:id_historia',
  ModuloController.consultarDatosPersonalesPaciente
);
hcRoutes.put(
  '/filiacion/historia/:id_historia',
  ModuloController.actualizarDatosPersonalesPaciente
);

hcRoutes.get('/:id/patient', hcController.consultarPacientePorHistoriaClinica);

hcRoutes.post('/review', hcController.registrarRevisionHistoriaClinica);

// Nuevas rutas para el flujo de borrador
hcRoutes.post('/draft', hcController.obtenerBorradorHistoriaClinica);
hcRoutes.patch('/assign-patient', hcController.asignarPacienteAHistoriaClinica);
// Endpoint para registrar una historia clínica
hcRoutes.post('/register', hcController.registrarHistoriaClinica);
// Nuevo endpoint para asignar alumno a una historia clínica

// --- RUTAS DE EXAMEN FÍSICO GENERAL ---

// Endpoints examen general
hcRoutes.post(
  '/examen-general',
  ExamenGeneralController.registrarExamenFisicoGeneral
);
hcRoutes.get(
  '/examen-general/historia/:id_historia',
  ExamenGeneralController.consultarExamenFisicoGeneral
);
hcRoutes.put(
  '/examen-general/historia/:id_historia',
  ExamenGeneralController.actualizarExamenFisicoGeneral
);

// Endpoints examen regional
hcRoutes.post(
  '/examen-regional',
  ExamenRegionalController.registrarExamenFisicoRegional
);
hcRoutes.get(
  '/examen-regional/historia/:id_historia',
  ExamenRegionalController.consultarExamenFisicoRegional
);
hcRoutes.put(
  '/examen-regional/historia/:id_historia',
  ExamenRegionalController.actualizarExamenFisicoRegional
);

// --- RUTAS DE EXAMEN FÍSICO GENERAL ---
hcRoutes.get(
  '/:id/examen-general',
  ExamenGeneralController.consultarExamenFisicoGeneral
);
hcRoutes.put(
  '/:id/examen-general',
  ExamenGeneralController.actualizarExamenFisicoGeneral
);

// --- RUTAS DE EXAMEN REGIONAL (CABEZA, ATM, CUELLO) ---
hcRoutes.get(
  '/:id/examen-regional',
  ExamenRegionalController.consultarExamenFisicoRegional
);
hcRoutes.put(
  '/:id/examen-regional',
  ExamenRegionalController.actualizarExamenFisicoRegional
);

// --- RUTAS DE EXAMEN CLÍNICO DE LA BOCA ---
hcRoutes.get('/:id/examen-boca', ExamenBocaController.consultarExamenBucal);
hcRoutes.put('/:id/examen-boca', ExamenBocaController.actualizarExamenBucal);

// --- RUTAS DE HIGIENE BUCAL ---
hcRoutes.get('/:id/higiene', HigieneBocalController.consultarHigieneBucal);
hcRoutes.put('/:id/higiene', HigieneBocalController.actualizarHigieneBucal);

// SECCIÓN III
hcRoutes.get(
  '/:id/diagnostico-presuntivo',
  DiagnosticoPresuntivoController.consultarDiagnosticoPresuntivo
);
hcRoutes.put(
  '/:id/diagnostico-presuntivo',
  DiagnosticoPresuntivoController.actualizarDiagnosticoPresuntivo
);

// SECCIÓN IV
hcRoutes.get(
  '/:id/derivacion',
  DerivacionClinicasController.consultarDerivacionClinicas
);
hcRoutes.put(
  '/:id/derivacion',
  DerivacionClinicasController.actualizarDerivacionClinicas
);

// SECCIÓN V
hcRoutes.get(
  '/:id/diagnostico-clinicas',
  DiagnosticoClinicasController.consultarDiagnosticoClinico
);
hcRoutes.put(
  '/:id/diagnostico-clinicas',
  DiagnosticoClinicasController.actualizarDiagnosticoClinico
);

// --- RUTAS DE EVOLUCIÓN ---
hcRoutes.get('/:id/evolucion', EvolucionController.consultarEvoluciones);
hcRoutes.post('/:id/evolucion', EvolucionController.registrarEvolucion);

// Endpoint para obtener todas las historias clínicas de un estudiante
hcRoutes.get('/student/:id', hcController.listarHistoriasClinicasPorEstudiante);
// Endpoint para obtener historias clínicas adultas de un estudiante específico
hcRoutes.get(
  '/student/:id/adult-historias',
  ListaHcAdultosController.listarHistoriasClinicasAdultasDeEstudiante
);

// --- BÚSQUEDA DE HISTORIAS CLÍNICAS ---
hcRoutes.get('/search', hcController.buscarHistoriasClinicas);

// --- PAGOS ---
hcRoutes.post('/:id/pago', PagoController.registrarPago);
hcRoutes.get('/:id/pago', PagoController.consultarPorHistoria);

// --- TRANSFERENCIA ---
hcRoutes.put('/:id/transferir', hcController.transferirHistoriaClinica);

// --- AUDITORÍA POR HC ---
hcRoutes.get('/:id/auditoria', AuditoriaController.listarPorHistoria);

// --- ODONTOGRAMA ---
hcRoutes.get('/:id/odontograma', OdontogramaController.listar);
hcRoutes.post('/:id/odontograma', OdontogramaController.registrar);
hcRoutes.delete('/:id/odontograma/:idEntrada', OdontogramaController.eliminar);

// --- MEDICAMENTOS / PRESCRIPCIONES ---
hcRoutes.get('/:id/prescripciones', PrescripcionController.listar);
hcRoutes.post('/:id/prescripciones', PrescripcionController.registrar);
hcRoutes.delete(
  '/:id/prescripciones/:idPrescripcion',
  PrescripcionController.eliminar
);

// --- ADJUNTOS ---
hcRoutes.get('/:id/adjuntos', AdjuntoController.listar);
hcRoutes.post('/:id/adjuntos', uploadMiddleware, AdjuntoController.subir);
hcRoutes.delete('/:id/adjuntos/:idAdjunto', AdjuntoController.eliminar);
hcRoutes.get('/:id/adjuntos/:idAdjunto/url', AdjuntoController.urlDescarga);

// --- FICHAS DE OPERACIÓN ---
hcRoutes.get('/:id/fichas-operacion', FichaOperacionController.listar);
hcRoutes.post('/:id/fichas-operacion', FichaOperacionController.registrar);
hcRoutes.get(
  '/:id/fichas-operacion/:idFicha',
  FichaOperacionController.obtener
);
hcRoutes.put(
  '/:id/fichas-operacion/:idFicha',
  FichaOperacionController.actualizar
);
hcRoutes.delete(
  '/:id/fichas-operacion/:idFicha',
  FichaOperacionController.eliminar
);
hcRoutes.get(
  '/:id/fichas-operacion/:idFicha/auditoria',
  FichaOperacionController.listarAuditoria
);

// --- FICHAS DE EVALUACIÓN ---
hcRoutes.get(
  '/:id/fichas-operacion/:idFicha/evaluacion',
  FichaEvaluacionController.obtenerPorFicha
);
hcRoutes.post(
  '/:id/fichas-operacion/:idFicha/evaluacion',
  FichaEvaluacionController.evaluar
);
hcRoutes.get(
  '/docente/evaluaciones',
  FichaEvaluacionController.listarPorDocente
);

// --- CONSENTIMIENTO INFORMADO (RF-09) ---
hcRoutes.get('/:id/consentimiento', ConsentimientoController.listar);
hcRoutes.post('/:id/consentimiento', ConsentimientoController.registrar);
hcRoutes.delete(
  '/:id/consentimiento/:idConsentimiento',
  ConsentimientoController.eliminar
);

// --- EXPORTACIÓN PDF (RF-08) ---
// POST vacío cuya única función es ser capturado por auditoriaMW.
// El middleware registra usuario, IP, timestamp y el id de la HC automáticamente.
hcRoutes.post('/:id/exportar-pdf', (req, res) =>
  res.status(200).json({ ok: true })
);

// --- CITAS ---
hcRoutes.get('/:id/citas', CitaController.listarPorHistoria);
hcRoutes.post('/:id/citas', CitaController.registrar);
hcRoutes.patch('/:id/citas/:idCita/estado', CitaController.actualizarEstado);
hcRoutes.delete('/:id/citas/:idCita', CitaController.eliminar);
hcRoutes.get('/mis-citas', CitaController.listarPorEstudiante);
