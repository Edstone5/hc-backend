import { randomUUID } from 'crypto';
import { IIhoSimplificadoRepository } from '../domain/ihoSimplificadoDomain.js';
import pool from '../../db/db.js';

const hoyISO = () => new Date().toISOString().slice(0, 10);

export class IhoSimplificadoRepository extends IIhoSimplificadoRepository {
  // Devuelve el registro IHO-S más reciente de la historia, con `valores`
  // ya parseado a objeto. null si no existe.
  async consultarPorHistoria(idHistoria) {
    const r = await pool.query(
      `SELECT * FROM iho_s WHERE id_historia = $1 ORDER BY created_at DESC`,
      [idHistoria]
    );
    const row = r.rows[0];
    if (!row) {
      return null;
    }
    let valores = [];
    try {
      valores =
        typeof row.valores === 'string'
          ? JSON.parse(row.valores)
          : row.valores || [];
    } catch {
      valores = [];
    }
    return { ...row, valores };
  }

  async guardar(agg) {
    const [
      idHistoria,
      valores,
      idb,
      icalc,
      ihos,
      clasificacion,
      fecha,
      idUsuario,
    ] = agg.obtenerParametros();
    await pool.query(
      `INSERT INTO iho_s
        (id_iho, id_historia, fecha, valores, idb, icalc, ihos, clasificacion, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        randomUUID(),
        idHistoria,
        fecha || hoyISO(),
        valores,
        idb,
        icalc,
        ihos,
        clasificacion,
        idUsuario,
      ]
    );
    return true;
  }
}
