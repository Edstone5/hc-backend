import pool from '../../db/db.js';

export class AuditoriaRepository {
  async listarPorHistoria(idHistoria) {
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha_cambio DESC LIMIT 100'
        : 'ORDER BY fecha_cambio DESC NULLS LAST LIMIT 100';
    const r = await pool.query(
      `SELECT a.*, u.nombre, u.apellido
       FROM auditoria a
       LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
       WHERE a.id_registro_afectado = $1 ${ob}`,
      [idHistoria]
    );
    return r.rows;
  }

  async listarGeneral({ idUsuario, tabla, desde, hasta } = {}) {
    const conds = [];
    const params = [];
    let i = 1;
    if (idUsuario) {
      conds.push(`a.id_usuario = $${i++}`);
      params.push(idUsuario);
    }
    if (tabla) {
      conds.push(`a.nombre_tabla = $${i++}`);
      params.push(tabla);
    }
    if (desde) {
      conds.push(`a.fecha_cambio >= $${i++}`);
      params.push(desde);
    }
    if (hasta) {
      conds.push(`a.fecha_cambio <= $${i++}`);
      params.push(hasta);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha_cambio DESC LIMIT 200'
        : 'ORDER BY fecha_cambio DESC NULLS LAST LIMIT 200';
    const r = await pool.query(
      `SELECT a.*, u.nombre, u.apellido
       FROM auditoria a
       LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
       ${where} ${ob}`,
      params
    );
    return r.rows;
  }
}
