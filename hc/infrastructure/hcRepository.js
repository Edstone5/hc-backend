/**
 * Adaptador Secundario: HcRepository
 * Encapsula consultas SQL usando `pool.query`.
 * Implementa {@link IHcRepository}.
 */
import { randomUUID } from 'crypto';
import { IHcRepository } from '../domain/hcDomain.js';
import pool from '../../db/db.js';

async function resolveEstadoRevisionId(estado) {
  if (!estado) {
    return null;
  }
  const r = await pool.query(
    'SELECT id_estado_revision FROM catalogo_estado_revision WHERE nombre = $1 LIMIT 1',
    [estado]
  );
  return r.rows[0]?.id_estado_revision || null;
}

class HcRepository extends IHcRepository {
  async crearRevision(agregado) {
    const [idHistoria, idDocente, estado, observaciones] =
      agregado.obtenerParametros();
    const idEstadoRevision = await resolveEstadoRevisionId(estado);
    await pool.query(
      `INSERT INTO revision_historia (id_revision, id_historia, id_docente, id_estado_revision, observaciones)
       VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), idHistoria, idDocente, idEstadoRevision, observaciones]
    );
    return true;
  }

  /**
   * Lista las revisiones docentes registradas para una historia clínica, con el
   * nombre del estado y los datos del docente. Orden cronológico descendente.
   */
  async listarRevisionesPorHistoria(idHistoria) {
    const result = await pool.query(
      `SELECT r.id_revision,
              r.id_historia,
              r.fecha,
              r.observaciones,
              c.nombre        AS estado,
              u.nombre        AS docente_nombre,
              u.apellido      AS docente_apellido,
              u.codigo_usuario AS docente_codigo
         FROM revision_historia r
         LEFT JOIN catalogo_estado_revision c
                ON c.id_estado_revision = r.id_estado_revision
         LEFT JOIN usuario u
                ON u.id_usuario = r.id_docente
        WHERE r.id_historia = $1
        ORDER BY r.fecha DESC`,
      [idHistoria]
    );
    return result.rows || [];
  }

  async crearHistoriaClinica(agregado) {
    const [idEstudiante] = agregado.obtenerParametros();
    const id = randomUUID();
    await pool.query(
      `INSERT INTO historia_clinica (id_historia, id_estudiante, estado)
       VALUES ($1, $2, 'activo')`,
      [id, idEstudiante]
    );
    const result = await pool.query(
      'SELECT * FROM historia_clinica WHERE id_historia = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async listarHistoriasPorEstudiante(agregado) {
    const result = await pool.query(
      'SELECT * FROM historia_clinica WHERE id_estudiante = $1',
      agregado.obtenerParametros()
    );
    return result.rows;
  }

  async obtenerBorrador(agregado) {
    const [idEstudiante] = agregado.obtenerParametros();
    const existing = await pool.query(
      `SELECT id_historia FROM historia_clinica WHERE id_estudiante = $1 AND estado = 'borrador' LIMIT 1`,
      [idEstudiante]
    );
    if (existing.rows[0]) {
      return { id_historia: existing.rows[0].id_historia };
    }
    const id = randomUUID();
    await pool.query(
      `INSERT INTO historia_clinica (id_historia, id_estudiante, estado)
       VALUES ($1, $2, 'borrador')`,
      [id, idEstudiante]
    );
    return { id_historia: id };
  }

  async asignarPaciente(agregado) {
    const [idHistoria, idPaciente] = agregado.obtenerParametros();
    await pool.query(
      `UPDATE historia_clinica SET id_paciente = $1, estado = 'activo' WHERE id_historia = $2`,
      [idPaciente, idHistoria]
    );
    return true;
  }

  async buscarHistorias({ q, year, idEstudiante }) {
    const condiciones = [];
    const params = [];
    let idx = 1;

    if (idEstudiante) {
      condiciones.push(`h.id_estudiante = $${idx++}`);
      params.push(idEstudiante);
    }
    if (year) {
      condiciones.push(
        pool.dialect === 'mysql'
          ? `YEAR(h.fecha_elaboracion) = $${idx++}`
          : `EXTRACT(YEAR FROM h.fecha_elaboracion) = $${idx++}`
      );
      params.push(parseInt(year));
    }
    if (q) {
      condiciones.push(
        `(CAST(h.id_historia AS VARCHAR) ILIKE $${idx} OR p.nombre ILIKE $${idx} OR p.apellido ILIKE $${idx} OR p.dni ILIKE $${idx})`
      );
      params.push(`%${q}%`);
      idx++;
    }

    const where = condiciones.length
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';
    const orderBy =
      pool.dialect === 'mysql'
        ? 'ORDER BY h.fecha_elaboracion DESC'
        : 'ORDER BY h.fecha_elaboracion DESC NULLS LAST';

    const result = await pool.query(
      `SELECT h.id_historia, h.estado, h.fecha_elaboracion,
              p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
              p.dni AS paciente_dni, p.fecha_nacimiento,
              u.nombre AS estudiante_nombre, u.apellido AS estudiante_apellido
       FROM historia_clinica h
       LEFT JOIN paciente p ON p.id_paciente = h.id_paciente
       LEFT JOIN usuario u ON u.id_usuario = h.id_estudiante
       ${where}
       ${orderBy}
       LIMIT 100`,
      params
    );
    return result.rows;
  }

  async transferirHistoria(idHistoria, idNuevoEstudiante, razon) {
    // Registrar el cambio de estudiante
    await pool.query(
      'UPDATE historia_clinica SET id_estudiante = $1 WHERE id_historia = $2',
      [idNuevoEstudiante, idHistoria]
    );
    // La auditoría la captura el middleware automáticamente
    return true;
  }

  async obtenerPacientePorHistoria(agregado) {
    const [idHistoria] = agregado.obtenerParametros();
    const result = await pool.query(
      `SELECT p.*
       FROM paciente p
       INNER JOIN historia_clinica h ON h.id_paciente = p.id_paciente
       WHERE h.id_historia = $1
       LIMIT 1`,
      [idHistoria]
    );
    return result.rows[0] || null;
  }
}

export { HcRepository };
