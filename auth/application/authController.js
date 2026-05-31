/**
 * Adaptador Primario: AuthController
 * Construye agregado de autenticación desde `req`, orquesta repositorio y tokens.
 */
import argon2 from 'argon2';
import { AuthRepository } from '../infrastructure/authRepository.js';
import { TokenService } from '../../services/tokenService.js';
import { CookieService } from '../../services/cookieServices.js';
import {
  DomainError,
  UserCodeValueObject,
  PasswordValueObject,
  AuthAggregate,
} from '../domain/authDomain.js';

const repo = new AuthRepository();

function esErrorDominio(err) {
  return err && (err instanceof DomainError || err.name === 'DomainError');
}

function construirAgregado(req) {
  const { userCode, password } = req.body;
  const userCodeVO = new UserCodeValueObject(userCode);
  const passwordVO = new PasswordValueObject(password);
  return new AuthAggregate({ userCodeVO, passwordVO });
}

export class AuthController {
  async iniciarSesion(req, res) {
    try {
      const agg = construirAgregado(req);
      const row = await repo.obtenerUsuarioPorUserCode(agg);
      if (!row) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const hashed =
        row.contrasena_hash ||
        row.hashed_password ||
        row.password ||
        row.pass ||
        row.pwd ||
        null;
      if (!hashed) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const ok = await argon2
        .verify(hashed, agg._password.value)
        .catch(() => false);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = {
        id: row.id_usuario,
        userCode: agg._userCode.value,
        firstName: row.nombre,
        lastName: row.apellido,
        email: row.email,
        role: row.rol,
      };

      const accessToken = TokenService.generateAccessToken(user);
      const refreshToken = TokenService.generateRefreshToken(user);

      CookieService.setTokenCookies(res, accessToken, refreshToken);

      return res.status(200).json(user);
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Renueva el access token usando el refresh token (cookie). No requiere un
  // access token válido (de hecho se usa cuando ya expiró). Mantiene el refresh
  // token vigente. Devuelve los datos del usuario para que el cliente reintente.
  async refrescarSesion(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
      }
      const decoded = TokenService.verifyRefreshToken(refreshToken);
      if (!decoded || decoded.type !== 'refresh' || !decoded.id) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      const row = await repo.obtenerUsuarioPorId(decoded.id);
      if (!row) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      const user = {
        id: row.id_usuario,
        userCode: row.codigo_usuario || row.user_code,
        firstName: row.nombre,
        lastName: row.apellido,
        email: row.email,
        role: row.rol,
      };
      const accessToken = TokenService.generateAccessToken(user);
      CookieService.setAccessCookie(res, accessToken);
      return res.status(200).json(user);
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  obtenerSesionActual(req, res) {
    return res.status(200).json(req.user);
  }

  cerrarSesion(req, res) {
    res.clearCookie('accessToken', { path: '/' });
    return res.status(200).json({ message: 'Logout exitoso' });
  }
}
