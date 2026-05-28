import jwt from 'jsonwebtoken';
export class TokenService {
  static generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        userCode: user.userCode,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
      }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
        type: 'refresh',
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: '7d',
      }
    );
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // console.error('Access token verification error');
      return null;
    }
  }

  static saveRefreshToken(refreshToken) {
    return true;
  }
}
