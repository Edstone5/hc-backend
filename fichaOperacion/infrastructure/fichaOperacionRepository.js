import { randomUUID } from 'crypto';
import { IFichaOperacionRepository } from '../domain/fichaOperacionDomain.js';
import pool from '../../db/db.js';

export class FichaOperacionRepository extends IFichaOperacionRepository {
  async listarPorHistoria(idHistoria) {
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY created_at DESC'
        : 'ORDER BY created_at DESC NULLS LAST';
    const r = await pool.query(
      `SELECT * FROM ficha_operacion WHERE id_historia = $1 ${ob}`,
      [idHistoria]
    );
    return r.rows;
  }

  async obtenerPorId(idFicha) {
    const r = await pool.query(
      'SELECT * FROM ficha_operacion WHERE id_ficha = $1',
      [idFicha]
    );
    return r.rows[0] || null;
  }

  async registrar(agg) {
    const id = randomUUID();
    const [
      idHistoria,
      diagnostico,
      procedimiento,
      materiales,
      observaciones,
      estado,
      fecha,
      alumno,
      idUsuario,
    ] = agg.obtenerParametros();
    await pool.query(
      `INSERT INTO ficha_operacion
        (id_ficha, id_historia, diagnostico, procedimiento, materiales, observaciones, estado, fecha, alumno, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8::date,CURRENT_DATE),$9,$10)`,
      [
        id,
        idHistoria,
        diagnostico,
        procedimiento,
        materiales,
        observaciones,
        estado,
        fecha,
        alumno,
        idUsuario,
      ]
    );
    return id;
  }

  async actualizar(idFicha, agg) {
    const [
      ,
      diagnostico,
      procedimiento,
      materiales,
      observaciones,
      estado,
      fecha,
      alumno,
    ] = agg.obtenerParametros();
    await pool.query(
      `UPDATE ficha_operacion SET diagnostico=$1, procedimiento=$2, materiales=$3,
       observaciones=$4, estado=$5, fecha=COALESCE($6::date,fecha), alumno=$7, updated_at=NOW()
       WHERE id_ficha=$8`,
      [
        diagnostico,
        procedimiento,
        materiales,
        observaciones,
        estado,
        fecha,
        alumno,
        idFicha,
      ]
    );
    return true;
  }

  async eliminar(idFicha) {
    await pool.query('DELETE FROM ficha_operacion WHERE id_ficha = $1', [
      idFicha,
    ]);
    return true;
  }

  async registrarAuditoria(
    idFicha,
    campo,
    valorAnterior,
    valorNuevo,
    idUsuario
  ) {
    await pool.query(
      `INSERT INTO ficha_operacion_auditoria (id, id_ficha, campo, valor_anterior, valor_nuevo, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [randomUUID(), idFicha, campo, valorAnterior, valorNuevo, idUsuario]
    );
  }

  async listarAuditoriaPorFicha(idFicha) {
    const r = await pool.query(
      `SELECT * FROM ficha_operacion_auditoria WHERE id_ficha = $1 ORDER BY fecha DESC`,
      [idFicha]
    );
    return r.rows;
  }
}
