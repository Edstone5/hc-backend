import { IStudentUsersRepository } from '../domain/studentUsersDomain.js';
import pool from '../../db/db.js';

/**
 * Adaptador Secundario: StudentUsersRepository para PostgreSQL.
 * Implementa {@link IStudentUsersRepository}.
 */
class StudentUsersRepository extends IStudentUsersRepository {
  async listarEstudiantes(agregado) {
    const params = agregado.obtenerParametros();
    const result = await pool.query(
      'SELECT * FROM usuario WHERE rol = $1',
      params
    );
    return result.rows;
  }
}

export { StudentUsersRepository };
