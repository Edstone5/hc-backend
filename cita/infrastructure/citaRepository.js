import { randomUUID } from 'crypto';
import { ICitaRepository } from '../domain/citaDomain.js';
import pool from '../../db/db.js';

export class CitaRepository extends ICitaRepository {
  async listarPorHistoria(idHistoria) {
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha_hora DESC'
        : 'ORDER BY fecha_hora DESC NULLS LAST';
    const r = await pool.query(
      `SELECT * FROM cita WHERE id_historia = $1 ${ob}`,
      [idHistoria]
    );
    return r.rows;
  }

  async listarPorEstudiante(idEstudiante, desde, hasta) {
    let sql =
      'SELECT c.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido FROM cita c LEFT JOIN historia_clinica h ON h.id_historia = c.id_historia LEFT JOIN paciente p ON p.id_paciente = h.id_paciente WHERE c.id_estudiante = $1';
    const params = [idEstudiante];
    let idx = 2;
    if (desde) {
      sql += ` AND c.fecha_hora >= $${idx++}`;
      params.push(desde);
    }
    if (hasta) {
      sql += ` AND c.fecha_hora <= $${idx++}`;
      params.push(hasta);
    }
    sql += ' ORDER BY c.fecha_hora ASC';
    const r = await pool.query(sql, params);
    return r.rows;
  }

  async verificarSolapamiento(
    idEstudiante,
    fechaInicio,
    duracionMin,
    excluirId = null
  ) {
    // Un solapamiento ocurre cuando dos citas se superponen en el tiempo
    const fechaFin = new Date(
      new Date(fechaInicio).getTime() + duracionMin * 60000
    ).toISOString();
    let sql = `SELECT id_cita FROM cita
               WHERE id_estudiante = $1
               AND estado NOT IN ('cancelada', 'completada')
               AND fecha_hora < $2
               AND (fecha_hora + ($3 * INTERVAL '1 minute')) > $4`;
    const params = [idEstudiante, fechaFin, duracionMin, fechaInicio];
    if (excluirId) {
      sql += ` AND id_cita != $5`;
      params.push(excluirId);
    }

    const r = await pool.query(sql, params);
    return r.rows.length > 0;
  }

  async registrar(agg) {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO cita (id_cita, id_historia, id_estudiante, fecha_hora, duracion_min, motivo, estado, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        agg.idHistoria,
        agg.idEstudiante,
        agg.fechaHora,
        agg.duracionMin,
        agg.motivo,
        agg.estado,
        agg.idUsuario,
      ]
    );
    return id;
  }

  async actualizarEstado(idCita, estado) {
    await pool.query('UPDATE cita SET estado = $1 WHERE id_cita = $2', [
      estado,
      idCita,
    ]);
    return true;
  }

  async eliminar(idCita) {
    await pool.query('DELETE FROM cita WHERE id_cita = $1', [idCita]);
    return true;
  }
}
