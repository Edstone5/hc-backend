import { TokenService } from '../services/tokenService.js';
const authMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    // console.log(req.cookies);
    if (!accessToken) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = TokenService.verifyAccessToken(accessToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = {
      id: decoded.id,
      userCode: decoded.userCode,
      role: decoded.role,
    };
    next();
  } catch {
    // console.error('Auth middleware error');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default authMiddleware;
