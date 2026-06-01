import { Router } from 'express';
import { UserController } from '../user/application/userController.js';
import { AuthController } from '../auth/application/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

export const userRoutes = Router();

const authController = new AuthController();

userRoutes.post('/register', UserController.registrarUsuario);
userRoutes.post('/login', authController.iniciarSesion);
// /refresh debe ir ANTES de authMiddleware: se usa cuando el access token ya
// expiró, y se autentica con el refresh token (cookie), no con el access token.
userRoutes.post('/refresh', (req, res) =>
  authController.refrescarSesion(req, res)
);
userRoutes.use(authMiddleware);
userRoutes.post('/logout', (req, res) => authController.cerrarSesion(req, res));

userRoutes.get('/me', authController.obtenerSesionActual);
userRoutes.get('/:id', UserController.obtenerUsuarioPorId);

//midddlware de admins(a futuro)
userRoutes.get('/', UserController.listarUsuarios);
userRoutes.patch('/:id/status', UserController.actualizarEstado);
