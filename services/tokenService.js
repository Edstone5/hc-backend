import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

const REFRESH_TTL_DAYS = 7;

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

  // Genera un refresh token con un identificador único (jti) para permitir su
  // rotación y revocación (ADR-0028). Devuelve el token firmado, su jti y la
  // fecha de expiración (para persistir en la tabla refresh_token).
  static generateRefreshToken(user) {
    const jti = randomUUID();
    const expiraEn = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );
    const token = jwt.sign(
      {
        id: user.id,
        type: 'refresh',
        jti,
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: `${REFRESH_TTL_DAYS}d`,
      }
    );
    return { token, jti, expiraEn };
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // console.error('Access token verification error');
      return null;
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return null;
    }
  }
}
