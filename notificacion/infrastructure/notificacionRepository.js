import { randomUUID } from 'crypto';
import { INotificacionRepository } from '../domain/notificacionDomain.js';
import pool from '../../db/db.js';

export class NotificacionRepository extends INotificacionRepository {
  async listarPorUsuario(idUsuario) {
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha DESC LIMIT 50'
        : 'ORDER BY fecha DESC NULLS LAST LIMIT 50';
    const r = await pool.query(
      `SELECT * FROM notificacion WHERE id_destinatario = $1 ${ob}`,
      [idUsuario]
    );
    return r.rows;
  }

  async contarNoLeidas(idUsuario) {
    const r = await pool.query(
      'SELECT COUNT(*) AS total FROM notificacion WHERE id_destinatario = $1 AND leida = FALSE',
      [idUsuario]
    );
    return parseInt(r.rows[0]?.total || 0);
  }

  async registrar(agg) {
    await pool.query(
      `INSERT INTO notificacion (id_notificacion, id_destinatario, titulo, mensaje, tipo, id_referencia)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        randomUUID(),
        agg.idDestinatario,
        agg.titulo,
        agg.mensaje,
        agg.tipo,
        agg.idReferencia,
      ]
    );
    return true;
  }

  async marcarLeida(idNotif) {
    await pool.query(
      'UPDATE notificacion SET leida = TRUE WHERE id_notificacion = $1',
      [idNotif]
    );
    return true;
  }

  async marcarTodasLeidas(idUsuario) {
    await pool.query(
      'UPDATE notificacion SET leida = TRUE WHERE id_destinatario = $1',
      [idUsuario]
    );
    return true;
  }
}
