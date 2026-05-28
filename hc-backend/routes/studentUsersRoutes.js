import { Router } from 'express';
import { getAllStudentUsers } from '../controllers/users/studentUsersController.js';

export const studentUsersRoutes = Router();

studentUsersRoutes.get('/', getAllStudentUsers);
