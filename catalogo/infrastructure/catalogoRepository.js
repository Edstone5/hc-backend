import { ICatalogoRepository } from '../domain/catalogoDomain.js';
import pool from '../../db/db.js';

/**
 * CatalogoRepository (Adaptador Secundario) para PostgreSQL.
 * Implementa {@link ICatalogoRepository}.
 */
class CatalogoRepository extends ICatalogoRepository {
  async listar(aggregate) {
    const [nombre] = aggregate.obtenerParametros();
    const result = await pool.query(`SELECT * FROM ${nombre}`);
    return result.rows;
  }

  async obtenerNombre(aggregate, idVO) {
    const [nombre] = aggregate.obtenerParametros();
    const result = await pool.query(
      `SELECT * FROM ${nombre} WHERE id_grupo_sanguineo = $1`,
      [idVO.value]
    );
    if (!result.rows.length) {
      return null;
    }
    const row = result.rows[0];
    return row.nombre || row.descripcion || null;
  }
}

export { CatalogoRepository };
