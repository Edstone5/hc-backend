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
}

export { AuthRepository };
