import { randomUUID } from 'crypto';
import { IFichaEvaluacionRepository } from '../domain/fichaEvaluacionDomain.js';
import pool from '../../db/db.js';

export class FichaEvaluacionRepository extends IFichaEvaluacionRepository {
  async obtenerPorFicha(idFicha) {
    const r = await pool.query(
      'SELECT * FROM ficha_evaluacion WHERE id_ficha = $1',
      [idFicha]
    );
    return r.rows[0] || null;
  }

  async registrar(agg) {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO ficha_evaluacion
        (id_evaluacion, id_ficha, id_historia, puntaje_total, comentarios, estado, id_docente, fecha_evaluacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [
        id,
        agg.idFicha,
        agg.idHistoria,
        agg.puntajeTotal,
        agg.comentarios,
        agg.estado,
        agg.idDocente,
      ]
    );
    return id;
  }

  async actualizar(idEval, agg) {
    await pool.query(
      `UPDATE ficha_evaluacion SET puntaje_total=$1, comentarios=$2, estado=$3, id_docente=$4, fecha_evaluacion=NOW()
       WHERE id_evaluacion=$5`,
      [agg.puntajeTotal, agg.comentarios, agg.estado, agg.idDocente, idEval]
    );
    return true;
  }

  async listarPorDocente(idDocente) {
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha_evaluacion DESC'
        : 'ORDER BY fecha_evaluacion DESC NULLS LAST';
    const r = await pool.query(
      `SELECT fe.*, fo.procedimiento, fo.alumno
       FROM ficha_evaluacion fe
       JOIN ficha_operacion fo ON fo.id_ficha = fe.id_ficha
       WHERE fe.id_docente = $1 ${ob}`,
      [idDocente]
    );
    return r.rows;
  }
}
