import { IExamenGeneralRepository } from '../domain/examenGeneralDomain.js';
import pool from '../../db/db.js';

export class ExamenGeneralRepository extends IExamenGeneralRepository {
  async create(agregado) {
    const params = agregado.obtenerParametros();
    const returning = pool.dialect === 'mysql' ? '' : ' RETURNING *';
    const { rows } = await pool.query(
      `INSERT INTO examen_general (
        id_historia, posicion, actitud, deambulacion, facies, facies_obs,
        conciencia, constitucion, estado_nutritivo, temperatura, presion_arterial,
        frecuencia_respiratoria, pulso, peso, talla, piel_color, piel_humedad,
        piel_lesiones, piel_lesiones_obs, piel_anexos, piel_anexos_obs,
        tcs_distribucion, tcs_distribucion_obs, tcs_cantidad, ganglios, ganglios_obs
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
      )${returning}`,
      params
    );
    if (pool.dialect === 'mysql') {
      const { rows: r } = await pool.query(
        'SELECT * FROM examen_general WHERE id_historia = $1',
        [params[0]]
      );
      return r[0] || null;
    }
    return rows[0] || null;
  }

  async getByHistoria(idHistoria) {
    const result = await pool.query(
      'SELECT * FROM examen_general WHERE id_historia = $1',
      [idHistoria]
    );
    const data = result.rows[0];
    if (!data) {
      return null;
    }
    return {
      posicion: data.posicion,
      actitud: data.actitud,
      deambulacion: data.deambulacion,
      facies: data.facies,
      faciesObs: data.facies_obs,
      conciencia: data.conciencia,
      constitucion: data.constitucion,
      estadoNutritivo: data.estado_nutritivo,
      temperatura: data.temperatura,
      presionArterial: data.presion_arterial,
      frecuenciaRespiratoria: data.frecuencia_respiratoria,
      pulso: data.pulso,
      peso: data.peso,
      talla: data.talla,
      pielColor: data.piel_color,
      pielHumedad: data.piel_humedad,
      pielLesiones: data.piel_lesiones,
      pielLesionesObs: data.piel_lesiones_obs,
      pielAnexos: data.piel_anexos,
      pielAnexosObs: data.piel_anexos_obs,
      tcsDistribucion: data.tcs_distribucion,
      tcsDistribucionObs: data.tcs_distribucion_obs,
      tcsCantidad: data.tcs_cantidad,
      ganglios: data.ganglios,
      gangliosObs: data.ganglios_obs,
    };
  }

  async update(agregado) {
    const p = agregado.obtenerParametros();
    // p[0]=id_historia, p[1..25]=campos
    await pool.query(
      `UPDATE examen_general SET
        posicion=$2, actitud=$3, deambulacion=$4, facies=$5, facies_obs=$6,
        conciencia=$7, constitucion=$8, estado_nutritivo=$9, temperatura=$10,
        presion_arterial=$11, frecuencia_respiratoria=$12, pulso=$13,
        peso=$14, talla=$15, piel_color=$16, piel_humedad=$17,
        piel_lesiones=$18, piel_lesiones_obs=$19, piel_anexos=$20, piel_anexos_obs=$21,
        tcs_distribucion=$22, tcs_distribucion_obs=$23, tcs_cantidad=$24,
        ganglios=$25, ganglios_obs=$26
       WHERE id_historia=$1`,
      p
    );
    return true;
  }
}

const examenGeneralRepository = new ExamenGeneralRepository();
export default examenGeneralRepository;
