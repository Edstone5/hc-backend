import { Router } from 'express';
import { PatientController } from '../controllers/patients/patientController.js';
import { PatientModel } from '../models/patient/patientModel.js';

export const patientRoutes = Router();

const patientController = new PatientController(PatientModel);

// POST /api/pacientes - Crear nuevo paciente
patientRoutes.post('/', patientController.createPatient);
patientRoutes.put('/:id', patientController.updatePatient);
