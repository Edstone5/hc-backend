import { IHigieneBocalRepository } from '../domain/higieneBocalDomain.js';
import pool from '../../db/db.js';

class HigieneBocalRepository extends IHigieneBocalRepository {
  async consultarPorHistoria(idHistory) {
    const result = await pool.query(
      'SELECT estado_higiene FROM examen_higiene_oral WHERE id_historia = $1',
      [idHistory]
    );
    const data = result.rows[0];
    if (!data) {
      return null;
    }
    return { estadoHigiene: data.estado_higiene };
  }

  async actualizarHigieneBocal(dataOrAggregate) {
    const params =
      dataOrAggregate && typeof dataOrAggregate.obtenerParametros === 'function'
        ? dataOrAggregate.obtenerParametros()
        : [
            dataOrAggregate?.idHistory,
            dataOrAggregate?.estadoHigiene,
            dataOrAggregate?.idUsuario,
          ];
    const [idHistory, estadoHigiene] = params;

    const existing = await pool.query(
      'SELECT id_higiene FROM examen_higiene_oral WHERE id_historia = $1',
      [idHistory]
    );
    if (existing.rows[0]) {
      await pool.query(
        'UPDATE examen_higiene_oral SET estado_higiene = $1 WHERE id_historia = $2',
        [estadoHigiene, idHistory]
      );
    } else {
      await pool.query(
        'INSERT INTO examen_higiene_oral (id_historia, estado_higiene) VALUES ($1, $2)',
        [idHistory, estadoHigiene]
      );
    }
    return true;
  }
}

export { HigieneBocalRepository };
