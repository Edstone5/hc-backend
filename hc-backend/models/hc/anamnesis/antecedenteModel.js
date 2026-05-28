import pool from '../../../db/db.js';

class AntecedentePersonal {
  static async create(data) {
    try {
      await pool.query(
        `CALL i_antecedente_personal($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)`,
        [
          data.id_historia,
          data.esta_embarazada,
          data.mac,
          data.otros,
          data.psicosocial,
          data.vacunas,
          data.hepatitis_b,
          data.grupo_sanguineo_desc,
          data.fuma,
          data.cigarrillos_dia,
          data.toma_te,
          data.tazas_te_dia,
          data.toma_alcohol,
          data.frecuencia_alcohol,
          data.aprieta_dientes,
          data.momento_aprieta,
          data.rechina,
          data.dolor_muscular,
          data.chupa_dedo,
          data.muerde_objetos,
          data.muerde_labios,
          data.otros_habitos,
          data.frecuencia_cepillado,
          data.cepillo_duro,
          data.cepillo_mediano,
          data.cepillo_blando,
          data.cepillo_electrico,
          data.cepillo_interproximal,
          data.tipo_interproximal,
          data.seda_dental,
          data.enjuague_bucal,
          data.otros_elementos_higiene,
        ]
      );

      // console.log('Antecedente personal creado exitosamente');
      return true;
    } catch (error) {
      // console.error(
      //   'Error al crear antecedente personal:',
      //   error.message,
      //   error.detail
      // );
      throw new Error(error.message || 'Error al crear antecedente personal');
    }
  }

  static async getById(id_antecedente) {
    try {
      const result = await pool.query(
        `SELECT * FROM antecedente_personal WHERE id_antecedente = $1`,
        [id_antecedente]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      // console.error('Error al obtener antecedente personal:', error.message);
      throw error;
    }
  }

  static async getByHistoria(id_historia) {
    try {
      const result = await pool.query(
        `SELECT * FROM antecedente_personal WHERE id_historia = $1`,
        [id_historia]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      // console.error(
      //   'Error al obtener antecedente personal por historia:',
      //   error.message
      // );
      throw error;
    }
  }

  static async update(id_historia, data) {
    try {
      await pool.query(
        `CALL u_antecedente_personal($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)`,
        [
          id_historia,
          data.esta_embarazada,
          data.mac,
          data.otros,
          data.psicosocial,
          data.vacunas,
          data.hepatitis_b,
          data.grupo_sanguineo_desc,
          data.fuma,
          data.cigarrillos_dia,
          data.toma_te,
          data.tazas_te_dia,
          data.toma_alcohol,
          data.frecuencia_alcohol,
          data.aprieta_dientes,
          data.momento_aprieta,
          data.rechina,
          data.dolor_muscular,
          data.chupa_dedo,
          data.muerde_objetos,
          data.muerde_labios,
          data.otros_habitos,
          data.frecuencia_cepillado,
          data.cepillo_duro,
          data.cepillo_mediano,
          data.cepillo_blando,
          data.cepillo_electrico,
          data.cepillo_interproximal,
          data.tipo_interproximal,
          data.seda_dental,
          data.enjuague_bucal,
          data.otros_elementos_higiene,
        ]
      );

      // console.log('Antecedente personal actualizado exitosamente');
      return true;
    } catch (error) {
      // console.error(
      //   'Error al actualizar antecedente personal:',
      //   error.message,
      //   error.detail
      // );
      throw new Error(
        error.message || 'Error al actualizar antecedente personal'
      );
    }
  }
}

class AntecedenteMedico {
  static async create(data) {
    try {
      await pool.query(
        `CALL i_antecedente_medico($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
        [
          data.id_historia,
          data.salud_general,
          data.bajo_tratamiento,
          data.tipo_tratamiento,
          data.hospitalizaciones,
          data.tuvo_traumatismos,
          data.tipo_traumatismos,
          data.alergias,
          data.medicamentos_contraindicados,
          data.enf_hepatitis,
          data.enf_alergia_cronica,
          data.enf_corazon,
          data.enf_fiebre_reumatica,
          data.enf_anemia,
          data.enf_asma,
          data.enf_diabetes,
          data.enf_epilepsia,
          data.enf_coagulacion,
          data.enf_tbc,
          data.enf_hipertension,
          data.enf_ulcera,
          data.enf_neurologica,
          data.otras_enf_patologicas,
          data.odontologicos,
        ]
      );
      return true;
    } catch (error) {
      // console.error('Error al crear antecedente médico:', error.message);
      throw error;
    }
  }

  static async getByHistoria(id_historia) {
    try {
      const result = await pool.query(
        `SELECT * FROM antecedente_medico WHERE id_historia = $1`,
        [id_historia]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      // console.error('Error al obtener antecedente médico:', error.message);
      throw error;
    }
  }

  static async update(id_historia, data) {
    try {
      await pool.query(
        `CALL u_antecedente_medico($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
        [
          id_historia,
          data.salud_general,
          data.bajo_tratamiento,
          data.tipo_tratamiento,
          data.hospitalizaciones,
          data.tuvo_traumatismos,
          data.tipo_traumatismos,
          data.alergias,
          data.medicamentos_contraindicados,
          data.enf_hepatitis,
          data.enf_alergia_cronica,
          data.enf_corazon,
          data.enf_fiebre_reumatica,
          data.enf_anemia,
          data.enf_asma,
          data.enf_diabetes,
          data.enf_epilepsia,
          data.enf_coagulacion,
          data.enf_tbc,
          data.enf_hipertension,
          data.enf_ulcera,
          data.enf_neurologica,
          data.otras_enf_patologicas,
          data.odontologicos,
        ]
      );
      return true;
    } catch (error) {
      // console.error('Error al actualizar antecedente médico:', error.message);
      throw error;
    }
  }
}

class AntecedenteFamiliar {
  static async create(data) {
    try {
      await pool.query(`CALL i_antecedente_familiar($1,$2)`, [
        data.id_historia,
        data.descripcion,
      ]);
      return true;
    } catch (error) {
      // console.error('Error al crear antecedente familiar:', error.message);
      throw error;
    }
  }

  static async getByHistoria(id_historia) {
    try {
      const result = await pool.query(
        `SELECT * FROM antecedente_familiar WHERE id_historia = $1`,
        [id_historia]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      // console.error('Error al obtener antecedente familiar:', error.message);
      throw error;
    }
  }

  static async update(id_historia, data) {
    try {
      await pool.query(`CALL u_antecedente_familiar($1,$2)`, [
        id_historia,
        data.descripcion,
      ]);
      return true;
    } catch (error) {
      // console.error('Error al actualizar antecedente familiar:', error.message);
      throw error;
    }
  }
}

class AntecedenteCumplimiento {
  static async create(data) {
    try {
      await pool.query(
        `CALL i_antecedente_cumplimiento($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          data.id_historia,
          data.motivo_dolor,
          data.motivo_control,
          data.frecuencia_control_meses,
          data.motivo_limpieza,
          data.frecuencia_limpieza_meses,
          data.actitud_tranquilo,
          data.actitud_aprensivo,
          data.actitud_panico,
          data.desagrado_atencion,
          data.fecha_consentimiento,
          data.firma_nombre,
          data.historia_elaborada_por,
        ]
      );
      return true;
    } catch (error) {
      // console.error('Error al crear antecedente cumplimiento:', error.message);
      throw error;
    }
  }

  static async getByHistoria(id_historia) {
    try {
      const result = await pool.query(
        `SELECT * FROM antecedente_cumplimiento WHERE id_historia = $1`,
        [id_historia]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      // console.error(
      //   'Error al obtener antecedente cumplimiento:',
      //   error.message
      // );
      throw error;
    }
  }

  static async update(id_historia, data) {
    try {
      await pool.query(
        `CALL u_antecedente_cumplimiento($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          id_historia,
          data.motivo_dolor,
          data.motivo_control,
          data.frecuencia_control_meses,
          data.motivo_limpieza,
          data.frecuencia_limpieza_meses,
          data.actitud_tranquilo,
          data.actitud_aprensivo,
          data.actitud_panico,
          data.desagrado_atencion,
          data.fecha_consentimiento,
          data.firma_nombre,
          data.historia_elaborada_por,
        ]
      );
      return true;
    } catch (error) {
      // console.error(
      //   'Error al actualizar antecedente cumplimiento:',
      //   error.message
      // );
      throw error;
    }
  }
}

export {
  AntecedentePersonal,
  AntecedenteMedico,
  AntecedenteFamiliar,
  AntecedenteCumplimiento,
};
