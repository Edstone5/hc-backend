import pool from '../../db/db.js';

export class ReporteRepository {
  async resumenAdmin({ desde, hasta, idEstudiante } = {}) {
    const conds = [];
    const params = [];
    let i = 1;
    if (idEstudiante) {
      conds.push(`h.id_estudiante = $${i++}`);
      params.push(idEstudiante);
    }
    if (desde) {
      conds.push(`h.fecha_elaboracion >= $${i++}`);
      params.push(desde);
    }
    if (hasta) {
      conds.push(`h.fecha_elaboracion <= $${i++}`);
      params.push(hasta);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [totales, porEstado, porMes, pendientesRevision] = await Promise.all([
      // Totales generales
      pool.query(
        `SELECT COUNT(*) AS total_hc, COUNT(DISTINCT h.id_paciente) AS total_pacientes, COUNT(DISTINCT h.id_estudiante) AS total_estudiantes FROM historia_clinica h ${where}`,
        params
      ),
      // Por estado
      pool.query(
        `SELECT h.estado, COUNT(*) AS cantidad FROM historia_clinica h ${where} GROUP BY h.estado ORDER BY cantidad DESC`,
        params
      ),
      // Por mes (últimos 12 meses)
      pool.dialect === 'mysql'
        ? pool.query(
            `SELECT DATE_FORMAT(h.fecha_elaboracion,'%Y-%m') AS mes, COUNT(*) AS cantidad FROM historia_clinica h ${where} GROUP BY mes ORDER BY mes DESC LIMIT 12`,
            params
          )
        : pool.query(
            `SELECT TO_CHAR(h.fecha_elaboracion,'YYYY-MM') AS mes, COUNT(*) AS cantidad FROM historia_clinica h ${where} GROUP BY mes ORDER BY mes DESC LIMIT 12`,
            params
          ),
      // Pendientes de revisión (HCs sin revisión)
      pool.query(
        `SELECT COUNT(*) AS pendientes FROM historia_clinica h WHERE h.id_historia NOT IN (SELECT DISTINCT id_historia FROM revision_historia) ${where ? 'AND ' + conds.map((c, j) => c.replace(`$${j + 1}`, `$${j + 1 + params.length}`)).join(' AND ') : ''}`,
        params
      ),
    ]);

    return {
      totales: totales.rows[0],
      porEstado: porEstado.rows,
      porMes: porMes.rows,
      pendientesRevision: pendientesRevision.rows[0]?.pendientes || 0,
    };
  }

  async resumenDocente(idDocente) {
    const [pendientes, evaluadas, errores] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total FROM ficha_evaluacion WHERE id_docente = $1 AND estado = 'pendiente'`,
        [idDocente]
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM ficha_evaluacion WHERE id_docente = $1 AND estado = 'validado'`,
        [idDocente]
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM ficha_evaluacion WHERE id_docente = $1 AND estado = 'requiere_correccion'`,
        [idDocente]
      ),
    ]);
    const totalEval =
      parseInt(evaluadas.rows[0]?.total || 0) +
      parseInt(errores.rows[0]?.total || 0);
    const pctError =
      totalEval > 0
        ? Math.round((parseInt(errores.rows[0]?.total || 0) / totalEval) * 100)
        : 0;

    return {
      pendientes: parseInt(pendientes.rows[0]?.total || 0),
      validadas: parseInt(evaluadas.rows[0]?.total || 0),
      requieren_correccion: parseInt(errores.rows[0]?.total || 0),
      pct_error: pctError,
    };
  }

  async exportarAnonimo({ desde, hasta } = {}) {
    // Retorna datos sin PII (nombre, apellido, DNI, email reemplazados)
    const conds = [];
    const params = [];
    let i = 1;
    if (desde) {
      conds.push(`h.fecha_elaboracion >= $${i++}`);
      params.push(desde);
    }
    if (hasta) {
      conds.push(`h.fecha_elaboracion <= $${i++}`);
      params.push(hasta);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const r = await pool.query(
      `SELECT
         h.id_historia, h.estado, h.fecha_elaboracion,
         DATE_PART('year', AGE(p.fecha_nacimiento))::int AS edad,
         p.sexo,
         d.descripcion AS diagnóstico_presuntivo_count
       FROM historia_clinica h
       LEFT JOIN paciente p ON p.id_paciente = h.id_paciente
       LEFT JOIN (
         SELECT id_historia, COUNT(*) AS descripcion FROM diagnostico GROUP BY id_historia
       ) d ON d.id_historia = h.id_historia
       ${where}
       ORDER BY h.fecha_elaboracion DESC
       LIMIT 1000`,
      params
    );
    return r.rows;
  }
}
