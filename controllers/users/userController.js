import jwt from 'jsonwebtoken';
import { validatePasswd } from '../../schemas/passwdSchema.js';

export class UserController {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async getAll(req, res) {
    const users = await this.userModel.getAll();
    return res.json(users);
  }

  async register(req, res) {
    try {
      const passwd = req.body.password;
      const validation = validatePasswd(passwd);
      if (!validation.success) {
        const msgs = JSON.parse(validation.error.message || '[]').map(
          (m) => m.message
        );
        return res.status(400).json({ error: msgs });
      }
      const created = await this.userModel.register(
        req.body.userCode,
        req.body.firstName,
        req.body.lastName,
        req.body.dni,
        req.body.email,
        req.body.role,
        passwd
      );
      if (!created) {
        return res.status(400).json({ error: 'Error registering user' });
      }
      return res.status(201).json(created);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async login(req, res) {
    try {
      const { userCode, password } = req.body;
      const user = await this.userModel.login(userCode, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // create token
      jwt.sign(
        { id: user.id, userCode: user.userCode, role: user.role },
        process.env.JWT_SECRET
      );
      return res.status(200).json(user);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await this.userModel.getUserById(req.params.id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'Usuario no encontrado' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export default UserController;
