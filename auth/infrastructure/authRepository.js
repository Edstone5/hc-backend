/**
 * Adaptador Secundario: AuthRepository
 * Encapsula la consulta SQL necesaria para autenticación.
 * Implementa {@link IAuthRepository}.
 */
import { IAuthRepository } from '../domain/authDomain.js';
import pool from '../../db/db.js';

class AuthRepository extends IAuthRepository {
  async obtenerUsuarioPorUserCode(agregado) {
    const [userCode] = agregado.obtenerParametros();
    const col = pool.dialect === 'mysql' ? 'user_code' : 'codigo_usuario';
    const result = await pool.query(
      `SELECT * FROM usuario WHERE ${col} = $1 LIMIT 1`,
      [userCode]
    );
    return result.rows[0] || null;
  }

  // Obtiene un usuario por su id (usado por el refresco de sesión, que necesita
  // userCode y rol para reemitir el access token a partir del refresh token).
  async obtenerUsuarioPorId(id) {
    const result = await pool.query(
      `SELECT * FROM usuario WHERE id_usuario = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  // ── Refresh tokens: rotación + revocación (ADR-0028) ─────────────────────
  async guardarRefreshToken({ jti, idUsuario, expiraEn }) {
    await pool.query(
      `INSERT INTO refresh_token (jti, id_usuario, expira_en)
       VALUES ($1, $2, $3)`,
      [jti, idUsuario, expiraEn]
    );
  }

  async obtenerRefreshToken(jti) {
    const result = await pool.query(
      `SELECT * FROM refresh_token WHERE jti = $1 LIMIT 1`,
      [jti]
    );
    return result.rows[0] || null;
  }

  async revocarRefreshToken(jti, reemplazadoPor = null) {
    await pool.query(
      `UPDATE refresh_token SET revocado = TRUE, reemplazado_por = $2
       WHERE jti = $1`,
      [jti, reemplazadoPor]
    );
  }

  async revocarTodosRefreshTokensDeUsuario(idUsuario) {
    await pool.query(
      `UPDATE refresh_token SET revocado = TRUE
       WHERE id_usuario = $1 AND revocado = FALSE`,
      [idUsuario]
    );
  }
}

export { AuthRepository };
