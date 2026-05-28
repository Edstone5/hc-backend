import { TokenService } from '../../services/tokenService.js';
import { CookieService } from '../../services/cookieServices.js';

export class AuthController {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async login(req, res) {
    try {
      const { userCode, password } = req.body || {};
      if (!userCode || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
      }
      const user = await this.userModel.login(userCode, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const access = TokenService.generateAccessToken(user);
      const refresh = TokenService.generateRefreshToken(user);
      CookieService.setTokenCookies(res, access, refresh);
      const { id, userCode: uc, firstName, lastName, email, role } = user;
      return res
        .status(200)
        .json({ id, userCode: uc, firstName, lastName, email, role });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCurrentUser(req, res) {
    return res.status(200).json(req.user);
  }
}
