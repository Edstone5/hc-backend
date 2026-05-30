import { randomUUID } from 'crypto';
import { IPrestamoEquipoRepository } from '../domain/prestamoEquipoDomain.js';
import pool from '../../db/db.js';

export class PrestamoEquipoRepository extends IPrestamoEquipoRepository {
  async listar({ idEstudiante, estado } = {}) {
    const conds = [];
    const params = [];
    let i = 1;
    if (idEstudiante) {
      conds.push(`p.id_estudiante = $${i++}`);
      params.push(idEstudiante);
    }
    if (estado) {
      conds.push(`p.estado = $${i++}`);
      params.push(estado);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY p.fecha_prestamo DESC'
        : 'ORDER BY p.fecha_prestamo DESC NULLS LAST';
    const r = await pool.query(
      `SELECT p.*, e.nombre AS equipo_nombre, e.codigo, u.nombre AS estudiante_nombre, u.apellido AS estudiante_apellido
       FROM prestamo_equipo p
       JOIN equipo e ON e.id_equipo = p.id_equipo
       JOIN usuario u ON u.id_usuario = p.id_estudiante
       ${where} ${ob}`,
      params
    );
    return r.rows;
  }

  async registrar(agg) {
    const id = randomUUID();
    // Actualizar estado del equipo
    await pool.query('UPDATE equipo SET estado = $1 WHERE id_equipo = $2', [
      'prestado',
      agg.idEquipo,
    ]);
    await pool.query(
      `INSERT INTO prestamo_equipo (id_prestamo, id_equipo, id_estudiante, fecha_devolucion_prevista, id_admin)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        id,
        agg.idEquipo,
        agg.idEstudiante,
        agg.fechaDevolucionPrevista,
        agg.idAdmin,
      ]
    );
    return id;
  }

  async devolver(idPrestamo) {
    const r = await pool.query(
      'SELECT id_equipo FROM prestamo_equipo WHERE id_prestamo = $1',
      [idPrestamo]
    );
    if (r.rows[0]) {
      await pool.query('UPDATE equipo SET estado = $1 WHERE id_equipo = $2', [
        'disponible',
        r.rows[0].id_equipo,
      ]);
    }
    await pool.query(
      `UPDATE prestamo_equipo SET fecha_devolucion_real = NOW(), estado = 'devuelto' WHERE id_prestamo = $1`,
      [idPrestamo]
    );
    return true;
  }
}
