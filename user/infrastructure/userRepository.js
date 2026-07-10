/**
 * Adaptador Secundario: UserRepository
 * Encapsula consultas SQL usando `pool.query`.
 * Implementa {@link IUserRepository}.
 */
import { randomUUID } from 'crypto';
import { IUserRepository } from '../domain/userDomain.js';
import pool from '../../db/db.js';

// Esquemas armonizados: tanto PostgreSQL/Neon como el init.sql de MySQL usan las
// columnas `codigo_usuario` y `contrasena_hash`. (Las ramas a `user_code`/`password`
// correspondían a un esquema MySQL antiguo y rompían sobre el init.sql actual.)
const userCodeCol = () => 'codigo_usuario';
const passwordCol = () => 'contrasena_hash';

class UserRepository extends IUserRepository {
  async listarUsuarios() {
    const result = await pool.query('SELECT * FROM usuario');
    return result.rows;
  }

  async registrarUsuario(agregado) {
    const [userCode, nombre, apellido, dni, email, rol, hashedPassword] =
      agregado.obtenerParametros();
    await pool.query(
      `INSERT INTO usuario (id_usuario, ${userCodeCol()}, nombre, apellido, dni, email, rol, ${passwordCol()})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        randomUUID(),
        userCode,
        nombre,
        apellido,
        dni,
        email,
        rol,
        hashedPassword,
      ]
    );
    return true;
  }

  async obtenerUsuarioPorId(id) {
    const result = await pool.query(
      'SELECT * FROM usuario WHERE id_usuario = $1 LIMIT 1',
      [id]
    );
    return result.rows[0] || null;
  }

  async obtenerUsuarioLogin(userCode) {
    const result = await pool.query(
      `SELECT * FROM usuario WHERE ${userCodeCol()} = $1 LIMIT 1`,
      [userCode]
    );
    return result.rows[0] || null;
  }

  async actualizarEstado(agregado) {
    await pool.query('UPDATE usuario SET activo = $1 WHERE id_usuario = $2', [
      agregado.activo,
      agregado.id,
    ]);
    return true;
  }
}

export { UserRepository };
