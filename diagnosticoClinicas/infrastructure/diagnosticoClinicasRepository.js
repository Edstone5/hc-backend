import { randomUUID } from 'crypto';
import { IDiagnosticoClinicasRepository } from '../domain/diagnosticoClinicasDomain.js';
import pool from '../../db/db.js';

class DiagnosticoClinicasRepository extends IDiagnosticoClinicasRepository {
  async consultarPorHistoria(idHistory) {
    const id = String(idHistory || '');
    if (!id) {
      return null;
    }
    const mapRow = (row) => {
      if (!row) {
        return null;
      }
      let examenes = {};
      try {
        examenes = row.examenes_auxiliares
          ? JSON.parse(row.examenes_auxiliares)
          : {};
      } catch {
        examenes = row.examenes_auxiliares || {};
      }
      return {
        fecha: row.fecha,
        clinicaRespuesta: row.clinica_respuesta,
        descripcion: row.descripcion,
        examenesAuxiliares: examenes,
        interconsultaDetalle: row.interconsulta_detalle,
        fechaInterconsulta: row.fecha_interconsulta,
        clinicaInterconsulta: row.clinica_interconsulta,
        diagnosticoDefinitivo: row.diagnostico_definitivo,
        tratamientoRealizar: row.tratamiento_realizar,
        pronostico: row.pronostico,
        alumnoTratante: row.alumno_tratante,
      };
    };
    const result = await pool.query(
      `SELECT fecha,clinica_respuesta,descripcion,examenes_auxiliares,interconsulta_detalle,fecha_interconsulta,clinica_interconsulta,diagnostico_definitivo,tratamiento_realizar,pronostico,alumno_tratante FROM diagnostico WHERE id_historia = $1 AND tipo = 'definitivo_clinicas'`,
      [id]
    );
    if (result.rows[0]) {
      return mapRow(result.rows[0]);
    }
    const orderBy =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha DESC LIMIT 1'
        : 'ORDER BY fecha DESC NULLS LAST LIMIT 1';
    const fallback = await pool.query(
      `SELECT fecha,clinica_respuesta,descripcion,examenes_auxiliares,interconsulta_detalle,fecha_interconsulta,clinica_interconsulta,diagnostico_definitivo,tratamiento_realizar,pronostico,alumno_tratante FROM diagnostico WHERE id_historia = $1 ${orderBy}`,
      [id]
    );
    return mapRow(fallback.rows[0]);
  }

  async actualizarDiagnosticoClinicas(aggregateOrObj) {
    const params =
      aggregateOrObj && typeof aggregateOrObj.obtenerParametros === 'function'
        ? aggregateOrObj.obtenerParametros()
        : [
            aggregateOrObj?.idHistory,
            aggregateOrObj?.fechaRespuesta,
            aggregateOrObj?.clinicaRespuesta,
            aggregateOrObj?.descripcionRespuesta,
            JSON.stringify(aggregateOrObj?.examenes || {}),
            aggregateOrObj?.interconsultaTipo,
            aggregateOrObj?.interconsultaFecha,
            aggregateOrObj?.interconsultaClinica,
            aggregateOrObj?.diagnosticoDefinitivo,
            aggregateOrObj?.tratamiento,
            aggregateOrObj?.pronostico,
            aggregateOrObj?.alumnoTratante,
            aggregateOrObj?.idUsuario,
          ];
    const [
      idHistory,
      fecha,
      clinicaRespuesta,
      descripcion,
      examenes,
      interconsultaTipo,
      interconsultaFecha,
      interconsultaClinica,
      diagnosticoDefinitivo,
      tratamiento,
      pronostico,
      alumnoTratante,
      idUsuario,
    ] = params;

    // Check if a row already exists for this historia+tipo
    const existing = await pool.query(
      `SELECT id_diagnostico FROM diagnostico WHERE id_historia = $1 AND tipo = 'definitivo_clinicas'`,
      [idHistory]
    );

    if (existing.rows[0]) {
      await pool.query(
        `UPDATE diagnostico SET fecha=$1, clinica_respuesta=$2, descripcion=$3, examenes_auxiliares=$4,
         interconsulta_detalle=$5, fecha_interconsulta=$6, clinica_interconsulta=$7,
         diagnostico_definitivo=$8, tratamiento_realizar=$9, pronostico=$10,
         alumno_tratante=$11, id_usuario=$12
         WHERE id_historia=$13 AND tipo='definitivo_clinicas'`,
        [
          fecha,
          clinicaRespuesta,
          descripcion,
          examenes,
          interconsultaTipo,
          interconsultaFecha,
          interconsultaClinica,
          diagnosticoDefinitivo,
          tratamiento,
          pronostico,
          alumnoTratante,
          idUsuario,
          idHistory,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO diagnostico (id_diagnostico, id_historia, tipo, fecha, clinica_respuesta, descripcion,
         examenes_auxiliares, interconsulta_detalle, fecha_interconsulta, clinica_interconsulta,
         diagnostico_definitivo, tratamiento_realizar, pronostico, alumno_tratante, id_usuario)
         VALUES ($1,$2,'definitivo_clinicas',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          randomUUID(),
          idHistory,
          fecha,
          clinicaRespuesta,
          descripcion,
          examenes,
          interconsultaTipo,
          interconsultaFecha,
          interconsultaClinica,
          diagnosticoDefinitivo,
          tratamiento,
          pronostico,
          alumnoTratante,
          idUsuario,
        ]
      );
    }
    return true;
  }
}

export { DiagnosticoClinicasRepository };
