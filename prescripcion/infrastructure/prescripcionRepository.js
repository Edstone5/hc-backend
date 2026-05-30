import { randomUUID } from 'crypto';
import { IPrescripcionRepository } from '../domain/prescripcionDomain.js';
import pool from '../../db/db.js';

export class PrescripcionRepository extends IPrescripcionRepository {
  async listarPorHistoria(idHistoria) {
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha DESC'
        : 'ORDER BY fecha DESC NULLS LAST';
    const r = await pool.query(
      `SELECT * FROM prescripcion WHERE id_historia = $1 ${ob}`,
      [idHistoria]
    );
    return r.rows;
  }

  async registrar(agg) {
    const [
      idHistoria,
      medicamento,
      dosis,
      duracion,
      fecha,
      prescriptor,
      idUsuario,
    ] = agg.obtenerParametros();
    await pool.query(
      `INSERT INTO prescripcion (id_prescripcion, id_historia, medicamento, dosis, duracion, fecha, prescriptor, id_usuario)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6::date, CURRENT_DATE),$7,$8)`,
      [
        randomUUID(),
        idHistoria,
        medicamento,
        dosis,
        duracion,
        fecha,
        prescriptor,
        idUsuario,
      ]
    );
    return true;
  }

  async eliminar(id) {
    await pool.query('DELETE FROM prescripcion WHERE id_prescripcion = $1', [
      id,
    ]);
    return true;
  }
}
