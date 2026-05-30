import { IExamenBocaRepository } from '../domain/examenBocaDomain.js';
import pool from '../../db/db.js';

export class ExamenBocaRepository extends IExamenBocaRepository {
  async getByHistoria(idHistoria) {
    const result = await pool.query(
      'SELECT * FROM examen_clinico_boca WHERE id_historia = $1',
      [idHistoria]
    );
    const data = result.rows[0];
    if (!data) {
      return null;
    }
    return {
      labiosSin: data.labios_sin_lesiones,
      labiosCon: data.labios_con_lesiones,
      vestibuloSin: data.vestibulo_sin_lesiones,
      vestibuloCon: data.vestibulo_con_lesiones,
      carrillosSin: data.carrillos_retromolar_sin_lesiones,
      carrillosCon: data.carrillos_retromolar_con_lesiones,
      paladarSin: data.paladar_sin_lesiones,
      paladarCon: data.paladar_con_lesiones,
      orofaringeSin: data.orofaringe_sin_lesiones,
      orofaringeCon: data.orofaringe_con_lesiones,
      pisoBocaSin: data.piso_boca_sin_lesiones,
      pisoBocaCon: data.piso_boca_con_lesiones,
      lenguaSin: data.lengua_sin_lesiones,
      lenguaCon: data.lengua_con_lesiones,
      enciaSin: data.encia_sin_lesiones,
      enciaCon: data.encia_con_lesiones,
      oclusionMolarDer: data.oclusion_molar_der,
      oclusionMolarIzq: data.oclusion_molar_izq,
      oclusionCaninaDer: data.oclusion_canina_der,
      oclusionCaninaIzq: data.oclusion_canina_izq,
      oclusionMordidaCruzada: data.oclusion_mordida_cruzada,
      oclusionVestibuloclusion: data.oclusion_vestibuloclusion,
      oclusionOverbite: data.oclusion_overbite,
      oclusionMordidaAbierta: data.oclusion_mordida_abierta,
      oclusionSobremordida: data.oclusion_sobremordida,
      oclusionVerticalOtros: data.oclusion_relacion_vertical_otros,
      oclusionOverjet: data.oclusion_overjet,
      oclusionProtrusion: data.oclusion_protrusion,
      oclusionGuiaIncisiva: data.oclusion_guia_incisiva,
      oclusionContactoPosterior: data.oclusion_contacto_posterior,
      latDerGuiaCanina: data.lat_der_guia_canina,
      latDerFuncionGrupo: data.lat_der_funcion_grupo,
      latDerContactoBalance: data.lat_der_contacto_balance,
      latDerDescriba: data.lat_der_describa,
      latIzqGuiaCanina: data.lat_izq_guia_canina,
      latIzqFuncionGrupo: data.lat_izq_funcion_grupo,
      latIzqContactoBalance: data.lat_izq_contacto_balance,
      latIzqDescriba: data.lat_izq_describa,
    };
  }

  async update(agregado) {
    const p = agregado.obtenerParametros();
    // p[0]=id_historia, p[1..38]=campos
    await pool.query(
      `UPDATE examen_clinico_boca SET
        labios_sin_lesiones=$2, labios_con_lesiones=$3,
        vestibulo_sin_lesiones=$4, vestibulo_con_lesiones=$5,
        carrillos_retromolar_sin_lesiones=$6, carrillos_retromolar_con_lesiones=$7,
        paladar_sin_lesiones=$8, paladar_con_lesiones=$9,
        orofaringe_sin_lesiones=$10, orofaringe_con_lesiones=$11,
        piso_boca_sin_lesiones=$12, piso_boca_con_lesiones=$13,
        lengua_sin_lesiones=$14, lengua_con_lesiones=$15,
        encia_sin_lesiones=$16, encia_con_lesiones=$17,
        oclusion_molar_der=$18, oclusion_molar_izq=$19,
        oclusion_canina_der=$20, oclusion_canina_izq=$21,
        oclusion_mordida_cruzada=$22, oclusion_vestibuloclusion=$23,
        oclusion_overbite=$24, oclusion_mordida_abierta=$25,
        oclusion_sobremordida=$26, oclusion_relacion_vertical_otros=$27,
        oclusion_overjet=$28, oclusion_protrusion=$29,
        oclusion_guia_incisiva=$30, oclusion_contacto_posterior=$31,
        lat_der_guia_canina=$32, lat_der_funcion_grupo=$33,
        lat_der_contacto_balance=$34, lat_der_describa=$35,
        lat_izq_guia_canina=$36, lat_izq_funcion_grupo=$37,
        lat_izq_contacto_balance=$38, lat_izq_describa=$39
       WHERE id_historia=$1`,
      p
    );
    return true;
  }
}

const examenBocaRepository = new ExamenBocaRepository();
export default examenBocaRepository;
