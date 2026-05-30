import { Router } from 'express';
import { UserController } from '../user/application/userController.js';
import { AuthController } from '../auth/application/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

export const userRoutes = Router();

const authController = new AuthController();

userRoutes.post('/register', UserController.registrarUsuario);
userRoutes.post('/login', authController.iniciarSesion);
userRoutes.use(authMiddleware);
userRoutes.post('/logout', authController.cerrarSesion);

userRoutes.get('/me', authController.obtenerSesionActual);
userRoutes.get('/:id', UserController.obtenerUsuarioPorId);

//midddlware de admins(a futuro)
userRoutes.get('/', UserController.listarUsuarios);
userRoutes.patch('/:id/status', UserController.actualizarEstado);
