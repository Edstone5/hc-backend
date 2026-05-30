import { randomUUID } from 'crypto';
import { IEpbRepository } from '../domain/epbDomain.js';
import pool from '../../db/db.js';

const hoyISO = () => new Date().toISOString().slice(0, 10);

export class EpbRepository extends IEpbRepository {
  async consultarPorHistoria(idHistoria) {
    const r = await pool.query(
      `SELECT * FROM epb WHERE id_historia = $1 ORDER BY created_at DESC`,
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
    const [idHistoria, valores, codigoMax, fecha, idUsuario] =
      agg.obtenerParametros();
    await pool.query(
      `INSERT INTO epb
        (id_epb, id_historia, fecha, valores, codigo_max, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        randomUUID(),
        idHistoria,
        fecha || hoyISO(),
        valores,
        codigoMax,
        idUsuario,
      ]
    );
    return true;
  }
}
