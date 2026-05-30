import { randomUUID } from 'crypto';
import { IOdontogramaRepository } from '../domain/odontogramaDomain.js';
import pool from '../../db/db.js';

export class OdontogramaRepository extends IOdontogramaRepository {
  async listarPorHistoria(idHistoria) {
    const orderBy =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha DESC'
        : 'ORDER BY fecha DESC NULLS LAST';
    const r = await pool.query(
      `SELECT * FROM odontograma_entrada WHERE id_historia = $1 ${orderBy}`,
      [idHistoria]
    );
    return r.rows;
  }

  async registrarEntrada(agg) {
    const [
      idHistoria,
      numeroDiente,
      superficie,
      diagnostico,
      tratamiento,
      fecha,
      alumno,
      idUsuario,
    ] = agg.obtenerParametros();
    await pool.query(
      `INSERT INTO odontograma_entrada
        (id_entrada, id_historia, numero_diente, superficie, diagnostico, tratamiento, fecha, alumno, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        randomUUID(),
        idHistoria,
        numeroDiente,
        superficie,
        diagnostico,
        tratamiento,
        fecha || 'CURRENT_DATE',
        alumno,
        idUsuario,
      ]
    );
    return true;
  }

  async eliminarEntrada(idEntrada) {
    await pool.query('DELETE FROM odontograma_entrada WHERE id_entrada = $1', [
      idEntrada,
    ]);
    return true;
  }
}
