import { Router } from 'express';
import { StudentController } from '../controllers/students/studentController.js';
import { StudentModel } from '../models/student/studentModel.js';
import authMiddleware from '../middlewares/authMiddleware.js';

export const studentRoutes = Router();

const studentController = new StudentController(StudentModel);

// GET /api/students/:id/patients/adult

studentRoutes.use(authMiddleware);
studentRoutes.get(
  '/:id/patients/adult',
  studentController.getAdultPatientsByStudentId
);
