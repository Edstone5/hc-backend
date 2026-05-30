import { randomUUID } from 'crypto';
import { IPagoRepository } from '../domain/pagoDomain.js';
import pool from '../../db/db.js';

export class PagoRepository extends IPagoRepository {
  async registrarPago(agregado) {
    const [idHistoria, monto, idAdmin] = agregado.obtenerParametros();
    await pool.query(
      `INSERT INTO pago_hc (id_pago, id_historia, monto, fecha_pago, id_admin)
       VALUES ($1, $2, $3, CURRENT_DATE, $4)`,
      [randomUUID(), idHistoria, monto, idAdmin]
    );
    return true;
  }

  async consultarPorHistoria(idHistoria) {
    const result = await pool.query(
      `SELECT id_pago, monto, fecha_pago, id_admin FROM pago_hc WHERE id_historia = $1 ORDER BY fecha_pago DESC`,
      [idHistoria]
    );
    return result.rows;
  }
}
