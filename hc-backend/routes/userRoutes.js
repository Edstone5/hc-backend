import { Router } from 'express';
import { UserController } from '../controllers/users/userController.js';
import { UserModel } from '../models/user/userModel.js';
import { AuthController } from '../controllers/users/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

export const userRoutes = Router();

const userController = new UserController(UserModel);
const authController = new AuthController(UserModel);

userRoutes.post('/register', userController.register);
userRoutes.post('/login', authController.login);
userRoutes.use(authMiddleware);
userRoutes.post('/logout', authController.logout);

userRoutes.get('/me', authController.getCurrentUser);
userRoutes.get('/:id', userController.getUserById);

//midddlware de admins(a futuro)
userRoutes.get('/', userController.getAll);
