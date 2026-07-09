import { randomUUID } from 'crypto';
import { IInformeFinalRepository } from '../domain/informeFinalDomain.js';
import pool from '../../db/db.js';

export class InformeFinalRepository extends IInformeFinalRepository {
  async registrar(agg) {
    const id = randomUUID();
    const [idHistoria, generadoPor, estado, secciones, fechaGeneracion] =
      agg.obtenerParametros();
    await pool.query(
      `INSERT INTO informe_final
        (id_informe, id_historia, generado_por, estado, secciones, fecha_generacion)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, idHistoria, generadoPor, estado, secciones, fechaGeneracion]
    );
    return id;
  }

  async listarPorHistoria(idHistoria) {
    const r = await pool.query(
      `SELECT id_informe, id_historia, generado_por, estado, fecha_generacion
       FROM informe_final
       WHERE id_historia = $1
       ORDER BY fecha_generacion DESC`,
      [idHistoria]
    );
    return r.rows;
  }

  async obtenerPorId(idInforme) {
    const r = await pool.query(
      'SELECT * FROM informe_final WHERE id_informe = $1',
      [idInforme]
    );
    return r.rows[0] || null;
  }

  async actualizarEstado(idInforme, estado) {
    await pool.query(
      'UPDATE informe_final SET estado = $1 WHERE id_informe = $2',
      [estado, idInforme]
    );
    return true;
  }
}
