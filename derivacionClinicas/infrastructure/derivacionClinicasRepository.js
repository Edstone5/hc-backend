import { IDerivacionClinicasRepository } from '../domain/derivacionClinicasDomain.js';
import pool from '../../db/db.js';

class DerivacionClinicasRepository extends IDerivacionClinicasRepository {
  async consultarPorHistoria(idHistory) {
    const id = String(idHistory || '');
    if (!id) {
      return null;
    }
    const result = await pool.query(
      'SELECT * FROM derivacion_clinicas WHERE id_historia = $1',
      [id]
    );
    const data = result.rows[0];
    if (!data) {
      return null;
    }
    let destinos = {};
    try {
      destinos = data.destinos ? JSON.parse(data.destinos) : {};
    } catch {
      destinos = data.destinos || {};
    }
    return {
      destinos,
      observaciones: data.observaciones,
      fechaDerivacion: data.fecha_derivacion,
      alumno: data.alumno_diagnostico,
      docente: data.docente,
    };
  }

  async actualizarDerivacionClinicas(aggregateOrObj) {
    const params =
      aggregateOrObj && typeof aggregateOrObj.obtenerParametros === 'function'
        ? aggregateOrObj.obtenerParametros()
        : [
            aggregateOrObj?.idHistory,
            JSON.stringify(aggregateOrObj?.destinos || {}),
            aggregateOrObj?.observaciones,
            aggregateOrObj?.alumno,
            aggregateOrObj?.docente,
            aggregateOrObj?.idUsuario,
          ];
    const [idHistory, destinos, observaciones, alumno, docente] = params;

    const existing = await pool.query(
      'SELECT id_derivacion FROM derivacion_clinicas WHERE id_historia = $1',
      [idHistory]
    );
    if (existing.rows[0]) {
      await pool.query(
        `UPDATE derivacion_clinicas SET destinos=$1, observaciones=$2,
         fecha_derivacion=CURRENT_DATE, alumno_diagnostico=$3, docente=$4
         WHERE id_historia=$5`,
        [destinos, observaciones, alumno, docente, idHistory]
      );
    } else {
      await pool.query(
        `INSERT INTO derivacion_clinicas (id_historia, destinos, observaciones, fecha_derivacion, alumno_diagnostico, docente)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)`,
        [idHistory, destinos, observaciones, alumno, docente]
      );
    }
    return true;
  }
}

export { DerivacionClinicasRepository };
