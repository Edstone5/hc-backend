import { IAntecedenteRepository } from '../domain/antecedenteDomain.js';
import pool from '../../db/db.js';

async function resolveGrupoSanguineoId(desc) {
  if (!desc) {
    return null;
  }
  const r = await pool.query(
    'SELECT id_grupo_sanguineo FROM catalogo_grupo_sanguineo WHERE descripcion = $1 LIMIT 1',
    [desc]
  );
  return r.rows[0]?.id_grupo_sanguineo || null;
}

export class AntecedenteRepository extends IAntecedenteRepository {
  // ── Antecedente Personal ──────────────────────────────────────────────────

  async createAntecedentePersonal(agregado) {
    const p = agregado.obtenerParametros();
    // p[7] = grupoSanguineoDesc (string) → needs ID lookup for NeonDB
    const idGrupoSanguineo = await resolveGrupoSanguineoId(p[7]);
    await pool.query(
      `INSERT INTO antecedente_personal (
        id_historia, esta_embarazada, mac, otros, psicosocial, vacunas, hepatitis_b,
        id_grupo_sanguineo, fuma, cigarrillos_dia, toma_te, tazas_te_dia,
        toma_alcohol, frecuencia_alcohol, aprieta_dientes, momento_aprieta, rechina,
        dolor_muscular, chupa_dedo, muerde_objetos, muerde_labios, otros_habitos,
        frecuencia_cepillado, cepillo_duro, cepillo_mediano, cepillo_blando,
        cepillo_electrico, cepillo_interproximal, tipo_interproximal, seda_dental,
        enjuague_bucal, otros_elementos_higiene
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)`,
      [...p.slice(0, 7), idGrupoSanguineo, ...p.slice(8)]
    );
    return true;
  }

  async getAntecedentePersonalByHistoria(idHistoria) {
    const { rows } = await pool.query(
      'SELECT * FROM antecedente_personal WHERE id_historia = $1',
      [idHistoria]
    );
    return rows[0];
  }

  async updateAntecedentePersonal(agregado) {
    const p = agregado.obtenerParametros();
    const idGrupoSanguineo = await resolveGrupoSanguineoId(p[7]);
    await pool.query(
      `UPDATE antecedente_personal SET
        esta_embarazada=$2, mac=$3, otros=$4, psicosocial=$5, vacunas=$6, hepatitis_b=$7,
        id_grupo_sanguineo=$8, fuma=$9, cigarrillos_dia=$10, toma_te=$11, tazas_te_dia=$12,
        toma_alcohol=$13, frecuencia_alcohol=$14, aprieta_dientes=$15, momento_aprieta=$16,
        rechina=$17, dolor_muscular=$18, chupa_dedo=$19, muerde_objetos=$20, muerde_labios=$21,
        otros_habitos=$22, frecuencia_cepillado=$23, cepillo_duro=$24, cepillo_mediano=$25,
        cepillo_blando=$26, cepillo_electrico=$27, cepillo_interproximal=$28,
        tipo_interproximal=$29, seda_dental=$30, enjuague_bucal=$31, otros_elementos_higiene=$32
       WHERE id_historia=$1`,
      [...p.slice(0, 7), idGrupoSanguineo, ...p.slice(8)]
    );
    return true;
  }

  // ── Antecedente Médico ───────────────────────────────────────────────────

  async createAntecedenteMedico(agregado) {
    const p = agregado.obtenerParametros();
    await pool.query(
      `INSERT INTO antecedente_medico (
        id_historia, salud_general, bajo_tratamiento, tipo_tratamiento, hospitalizaciones,
        tuvo_traumatismos, tipo_traumatismos, alergias, medicamentos_contraindicados,
        enf_hepatitis, enf_alergia_cronica, enf_corazon, enf_fiebre_reumatica, enf_anemia,
        enf_asma, enf_diabetes, enf_epilepsia, enf_coagulacion, enf_tbc, enf_hipertension,
        enf_ulcera, enf_neurologica, otras_enf_patologicas, odontologicos
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
      p
    );
    return true;
  }

  async getAntecedenteMedicoByHistoria(idHistoria) {
    const { rows } = await pool.query(
      'SELECT * FROM antecedente_medico WHERE id_historia = $1',
      [idHistoria]
    );
    return rows[0];
  }

  async updateAntecedenteMedico(agregado) {
    const p = agregado.obtenerParametros();
    await pool.query(
      `UPDATE antecedente_medico SET
        salud_general=$2, bajo_tratamiento=$3, tipo_tratamiento=$4, hospitalizaciones=$5,
        tuvo_traumatismos=$6, tipo_traumatismos=$7, alergias=$8, medicamentos_contraindicados=$9,
        enf_hepatitis=$10, enf_alergia_cronica=$11, enf_corazon=$12, enf_fiebre_reumatica=$13,
        enf_anemia=$14, enf_asma=$15, enf_diabetes=$16, enf_epilepsia=$17, enf_coagulacion=$18,
        enf_tbc=$19, enf_hipertension=$20, enf_ulcera=$21, enf_neurologica=$22,
        otras_enf_patologicas=$23, odontologicos=$24
       WHERE id_historia=$1`,
      p
    );
    return true;
  }

  // ── Antecedente Familiar ─────────────────────────────────────────────────

  async createAntecedenteFamiliar(agregado) {
    const [idHistoria, descripcion] = agregado.obtenerParametros();
    await pool.query(
      'INSERT INTO antecedente_familiar (id_historia, descripcion) VALUES ($1, $2)',
      [idHistoria, descripcion]
    );
    return true;
  }

  async getAntecedenteFamiliarByHistoria(idHistoria) {
    const { rows } = await pool.query(
      'SELECT * FROM antecedente_familiar WHERE id_historia = $1',
      [idHistoria]
    );
    return rows[0];
  }

  async updateAntecedenteFamiliar(agregado) {
    const [idHistoria, descripcion] = agregado.obtenerParametros();
    await pool.query(
      'UPDATE antecedente_familiar SET descripcion=$1 WHERE id_historia=$2',
      [descripcion, idHistoria]
    );
    return true;
  }

  // ── Antecedente Cumplimiento ──────────────────────────────────────────────

  async createAntecedenteCumplimiento(agregado) {
    const p = agregado.obtenerParametros();
    await pool.query(
      `INSERT INTO antecedente_cumplimiento (
        id_historia, motivo_dolor, motivo_control, frecuencia_control_meses,
        motivo_limpieza, frecuencia_limpieza_meses, actitud_tranquilo, actitud_aprensivo,
        actitud_panico, desagrado_atencion, fecha_consentimiento, firma_nombre, historia_elaborada_por
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      p
    );
    return true;
  }

  async getAntecedenteCumplimientoByHistoria(idHistoria) {
    const { rows } = await pool.query(
      'SELECT * FROM antecedente_cumplimiento WHERE id_historia = $1',
      [idHistoria]
    );
    return rows[0];
  }

  async updateAntecedenteCumplimiento(agregado) {
    const p = agregado.obtenerParametros();
    await pool.query(
      `UPDATE antecedente_cumplimiento SET
        motivo_dolor=$2, motivo_control=$3, frecuencia_control_meses=$4,
        motivo_limpieza=$5, frecuencia_limpieza_meses=$6, actitud_tranquilo=$7,
        actitud_aprensivo=$8, actitud_panico=$9, desagrado_atencion=$10,
        fecha_consentimiento=$11, firma_nombre=$12, historia_elaborada_por=$13
       WHERE id_historia=$1`,
      p
    );
    return true;
  }
}

const antecedenteRepository = new AntecedenteRepository();
export default antecedenteRepository;
