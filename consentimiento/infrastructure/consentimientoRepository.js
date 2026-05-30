/**
 * Adaptador Secundario: ConsentimientoRepository
 * Encapsula las consultas SQL para la tabla `consentimiento_informado`.
 * Implementa {@link IConsentimientoRepository}.
 */
import { randomUUID } from 'crypto';
import { IConsentimientoRepository } from '../domain/consentimientoDomain.js';
import pool from '../../db/db.js';

export class ConsentimientoRepository extends IConsentimientoRepository {
  async listarPorHistoria(idHistoria) {
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY created_at DESC'
        : 'ORDER BY created_at DESC NULLS LAST';
    const r = await pool.query(
      `SELECT c.*, u.nombre AS nombre_usuario, u.apellido AS apellido_usuario
       FROM consentimiento_informado c
       LEFT JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE c.id_historia = $1 ${ob}`,
      [idHistoria]
    );
    return r.rows;
  }

  async registrar(aggregate) {
    const [
      idHistoria,
      tipoTemplate,
      nombrePaciente,
      nombreResponsable,
      fechaConsentimiento,
      idUsuario,
    ] = aggregate.obtenerParametros();

    const id = randomUUID();
    await pool.query(
      `INSERT INTO consentimiento_informado
         (id_consentimiento, id_historia, tipo_template, nombre_paciente,
          nombre_responsable, fecha_consentimiento, id_usuario)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE), $7)`,
      [
        id,
        idHistoria,
        tipoTemplate,
        nombrePaciente,
        nombreResponsable,
        fechaConsentimiento,
        idUsuario,
      ]
    );

    const result = await pool.query(
      'SELECT * FROM consentimiento_informado WHERE id_consentimiento = $1',
      [id]
    );
    return result.rows[0];
  }

  async eliminar(idConsentimiento) {
    await pool.query(
      'DELETE FROM consentimiento_informado WHERE id_consentimiento = $1',
      [idConsentimiento]
    );
    return true;
  }
}
