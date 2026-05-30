import { IEvolucionRepository } from '../domain/evolucionDomain.js';
import pool from '../../db/db.js';

class EvolucionRepository extends IEvolucionRepository {
  async consultarEvoluciones(idHistory) {
    const id = String(idHistory || '');
    if (!id) {
      return [];
    }
    const orderBy =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha DESC, id_evolucion DESC'
        : 'ORDER BY fecha DESC NULLS LAST, id_evolucion DESC';
    const result = await pool.query(
      `SELECT * FROM evolucion WHERE id_historia = $1 ${orderBy}`,
      [id]
    );
    return result.rows;
  }

  async registrarEvolucion(aggregateOrObj) {
    const params =
      aggregateOrObj && typeof aggregateOrObj.obtenerParametros === 'function'
        ? aggregateOrObj.obtenerParametros()
        : [
            aggregateOrObj?.idHistory,
            aggregateOrObj?.fecha,
            aggregateOrObj?.actividad,
            aggregateOrObj?.alumno,
            aggregateOrObj?.idUsuario,
          ];
    const [idHistory, fecha, actividad, alumno] = params;
    await pool.query(
      `INSERT INTO evolucion (id_historia, fecha, actividad, alumno)
       VALUES ($1, $2, $3, $4)`,
      [idHistory, fecha, actividad, alumno]
    );
    return true;
  }
}

export { EvolucionRepository };
