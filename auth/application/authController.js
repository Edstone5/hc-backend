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
      const {
        token: refreshToken,
        jti,
        expiraEn,
      } = TokenService.generateRefreshToken(user);

      // Persistir el refresh token emitido para poder rotarlo/revocarlo (ADR-0028).
      await repo.guardarRefreshToken({
        jti,
        idUsuario: user.id,
        expiraEn,
      });

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
  // access token válido (de hecho se usa cuando ya expiró). ROTACIÓN (ADR-0028):
  // valida que el jti no esté revocado, lo revoca, emite un refresh token NUEVO
  // (enlazado por reemplazado_por) y reemite ambas cookies. DETECCIÓN DE REÚSO:
  // si llega un jti ya revocado, se revocan todos los tokens del usuario.
  async refrescarSesion(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
      }
      const decoded = TokenService.verifyRefreshToken(refreshToken);
      if (
        !decoded ||
        decoded.type !== 'refresh' ||
        !decoded.id ||
        !decoded.jti
      ) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // El jti debe existir y NO estar revocado. Si está revocado, es un reúso
      // (token robado o ya rotado): se revoca toda la cadena del usuario.
      const registro = await repo.obtenerRefreshToken(decoded.jti);
      if (!registro) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      const estaRevocado =
        registro.revocado === true || registro.revocado === 1;
      if (estaRevocado) {
        await repo.revocarTodosRefreshTokensDeUsuario(decoded.id);
        return res.status(401).json({ error: 'Refresh token reuse detected' });
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

      // Rotación: emitir un refresh token nuevo y revocar el usado, enlazándolos.
      const accessToken = TokenService.generateAccessToken(user);
      const {
        token: nuevoRefresh,
        jti: nuevoJti,
        expiraEn,
      } = TokenService.generateRefreshToken(user);
      await repo.guardarRefreshToken({
        jti: nuevoJti,
        idUsuario: user.id,
        expiraEn,
      });
      await repo.revocarRefreshToken(decoded.jti, nuevoJti);

      CookieService.setTokenCookies(res, accessToken, nuevoRefresh);
      return res.status(200).json(user);
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  obtenerSesionActual(req, res) {
    return res.status(200).json(req.user);
  }

  // Cierra sesión: revoca el refresh token actual (si lo hay) y limpia cookies.
  async cerrarSesion(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        const decoded = TokenService.verifyRefreshToken(refreshToken);
        if (decoded?.jti) {
          await repo.revocarRefreshToken(decoded.jti, null);
        }
      }
    } catch {
      // No bloquear el logout por un fallo al revocar; las cookies se limpian igual.
    }
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return res.status(200).json({ message: 'Logout exitoso' });
  }
}
