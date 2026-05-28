import { TokenService } from '../../services/tokenService.js';
import { CookieService } from '../../services/cookieServices.js';
export class AuthController {
  constructor(UserModel) {
    this.UserModel = UserModel;
  }

  login = async (req, res) => {
    try {
      const { userCode, password } = req.body;

      if (!userCode || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
      }

      // console.log('Attempting login for userCode:', userCode);
      const user = await this.UserModel.login(userCode, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const accessToken = TokenService.generateAccessToken(user);
      const refreshToken = TokenService.generateRefreshToken(user);

      CookieService.setTokenCookies(res, accessToken, refreshToken);

      res.status(200).json({
        id: user.id,
        userCode: user.userCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getCurrentUser = async (req, res) => {
    res.status(200).json(req.user);
  };

  logout = (req, res) => {
    res.clearCookie('accessToken', { path: '/' });
    res.status(200).json({ message: 'Logout exitoso' });
  };
}
