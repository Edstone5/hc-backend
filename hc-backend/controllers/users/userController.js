import jwt from 'jsonwebtoken';
import { validatePasswd } from '../../schemas/passwdSchema.js';

export class UserController {
  constructor(UserModel) {
    this.UserModel = UserModel;
  }

  getAll = async (req, res) => {
    const users = await this.UserModel.getAll();
    res.json(users);
  };

  register = async (req, res) => {
    const { userCode, firstName, lastName, dni, email, role, password } =
      req.body;
    const result = validatePasswd(password);
    if (!result.success) {
      return res.status(400).json({
        error: JSON.parse(result.error.message).map((e) => e.message),
      });
    }
    const newUser = await this.UserModel.register(
      userCode,
      firstName,
      lastName,
      dni,
      email,
      role,
      password
    );
    if (!newUser) {
      return res.status(400).json({ error: 'Error registering user' });
    }
    res.status(201).json(newUser);
  };

  login = async (req, res) => {
    const { userCode, password } = req.body;
    const user = await this.UserModel.login(userCode, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, 'secret'); // Usa tu clave real en producción
    res.status(200).json({ ...user, token });
  };

  getUserById = async (req, res) => {
    const { id } = req.params;
    const user = await this.UserModel.getUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  };
}
