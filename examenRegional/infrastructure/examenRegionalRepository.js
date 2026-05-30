import { IExamenRegionalRepository } from '../domain/examenRegionalDomain.js';
import pool from '../../db/db.js';

export class ExamenRegionalRepository extends IExamenRegionalRepository {
  async create(agregado) {
    const params = agregado.obtenerParametros();
    const returning = pool.dialect === 'mysql' ? '' : ' RETURNING *';
    const { rows } = await pool.query(
      `INSERT INTO examen_regional (
        id_historia,cabeza_posicion,cabeza_movimientos,cabeza_movimientos_obs,
        craneo_tamano,craneo_forma,cara_forma_frente,cara_forma_perfil,
        ojos_cejas_adecuada,ojos_implantacion_obs,ojos_escleroticas,ojos_agudeza_visual,
        ojos_iris_color,ojos_arco_senil,nariz_forma,nariz_permeables,nariz_secreciones,
        nariz_senos_dolorosos,oidos_anomalias_morfologicas,oidos_anomalias_obs,
        oidos_secreciones,oidos_audicion_conservada,atm_trayectoria,
        atm_lat_izq_dolor,atm_lat_izq_ruido,atm_lat_izq_salto,
        atm_lat_der_dolor,atm_lat_der_ruido,atm_lat_der_salto,
        atm_prot_dolor,atm_prot_ruido,atm_prot_salto,
        atm_aper_dolor,atm_aper_ruido,atm_aper_salto,
        atm_cierre_dolor,atm_cierre_ruido,atm_cierre_salto,
        atm_coordinacion_condilar,atm_apertura_maxima_mm,atm_observaciones,
        atm_musculos_dolor,atm_musculos_dolor_grado,atm_musculos_dolor_zona,
        cuello_simetrico,cuello_simetrico_obs,cuello_movilidad_conservada,
        cuello_movilidad_obs,laringe_alineada,laringe_alineada_obs,cuello_otros
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
        $39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51
      )${returning}`,
      params
    );
    if (pool.dialect === 'mysql') {
      const { rows: r } = await pool.query(
        'SELECT * FROM examen_regional WHERE id_historia = $1',
        [params[0]]
      );
      return r[0] || null;
    }
    return rows[0] || null;
  }

  async getByHistoria(idHistoria) {
    const result = await pool.query(
      'SELECT * FROM examen_regional WHERE id_historia = $1',
      [idHistoria]
    );
    const data = result.rows[0];
    if (!data) {
      return null;
    }
    return {
      cabezaPosicion: data.cabeza_posicion,
      cabezaMovimientos: data.cabeza_movimientos,
      cabezaMovimientosObs: data.cabeza_movimientos_obs,
      craneoTamano: data.craneo_tamano,
      craneoForma: data.craneo_forma,
      caraFormaFrente: data.cara_forma_frente,
      caraFormaPerfil: data.cara_forma_perfil,
      ojosCejasAdecuada: data.ojos_cejas_adecuada,
      ojosImplantacionObs: data.ojos_implantacion_obs,
      ojosEscleroticas: data.ojos_escleroticas,
      ojosAgudezaVisual: data.ojos_agudeza_visual,
      ojosIrisColor: data.ojos_iris_color,
      ojosArcoSenil: data.ojos_arco_senil,
      narizForma: data.nariz_forma,
      narizPermeables: data.nariz_permeables,
      narizSecreciones: data.nariz_secreciones,
      narizSenosDolorosos: data.nariz_senos_dolorosos,
      oidosAnomaliasMorfologicas: data.oidos_anomalias_morfologicas,
      oidosAnomaliasObs: data.oidos_anomalias_obs,
      oidosSecreciones: data.oidos_secreciones,
      oidosAudicionConservada: data.oidos_audicion_conservada,
      atmTrayectoria: data.atm_trayectoria,
      atmLatIzqDolor: data.atm_lat_izq_dolor,
      atmLatIzqRuido: data.atm_lat_izq_ruido,
      atmLatIzqSalto: data.atm_lat_izq_salto,
      atmLatDerDolor: data.atm_lat_der_dolor,
      atmLatDerRuido: data.atm_lat_der_ruido,
      atmLatDerSalto: data.atm_lat_der_salto,
      atmProtDolor: data.atm_prot_dolor,
      atmProtRuido: data.atm_prot_ruido,
      atmProtSalto: data.atm_prot_salto,
      atmAperDolor: data.atm_aper_dolor,
      atmAperRuido: data.atm_aper_ruido,
      atmAperSalto: data.atm_aper_salto,
      atmCierreDolor: data.atm_cierre_dolor,
      atmCierreRuido: data.atm_cierre_ruido,
      atmCierreSalto: data.atm_cierre_salto,
      atmCoordinacionCondilar: data.atm_coordinacion_condilar,
      atmAperturaMaximaMm: data.atm_apertura_maxima_mm,
      atmObservaciones: data.atm_observaciones,
      atmMusculosDolor: data.atm_musculos_dolor,
      atmMusculosDolorGrado: data.atm_musculos_dolor_grado,
      atmMusculosDolorZona: data.atm_musculos_dolor_zona,
      cuelloSimetrico: data.cuello_simetrico,
      cuelloSimetricoObs: data.cuello_simetrico_obs,
      cuelloMovilidadConservada: data.cuello_movilidad_conservada,
      cuelloMovilidadObs: data.cuello_movilidad_obs,
      laringeAlineada: data.laringe_alineada,
      laringeAlineadaObs: data.laringe_alineada_obs,
      cuelloOtros: data.cuello_otros,
    };
  }

  async update(agregado) {
    const p = agregado.obtenerParametros();
    // p[0]=id_historia, p[1..50]=campos
    await pool.query(
      `UPDATE examen_regional SET
        cabeza_posicion=$2, cabeza_movimientos=$3, cabeza_movimientos_obs=$4,
        craneo_tamano=$5, craneo_forma=$6, cara_forma_frente=$7, cara_forma_perfil=$8,
        ojos_cejas_adecuada=$9, ojos_implantacion_obs=$10, ojos_escleroticas=$11,
        ojos_agudeza_visual=$12, ojos_iris_color=$13, ojos_arco_senil=$14,
        nariz_forma=$15, nariz_permeables=$16, nariz_secreciones=$17,
        nariz_senos_dolorosos=$18, oidos_anomalias_morfologicas=$19, oidos_anomalias_obs=$20,
        oidos_secreciones=$21, oidos_audicion_conservada=$22, atm_trayectoria=$23,
        atm_lat_izq_dolor=$24, atm_lat_izq_ruido=$25, atm_lat_izq_salto=$26,
        atm_lat_der_dolor=$27, atm_lat_der_ruido=$28, atm_lat_der_salto=$29,
        atm_prot_dolor=$30, atm_prot_ruido=$31, atm_prot_salto=$32,
        atm_aper_dolor=$33, atm_aper_ruido=$34, atm_aper_salto=$35,
        atm_cierre_dolor=$36, atm_cierre_ruido=$37, atm_cierre_salto=$38,
        atm_coordinacion_condilar=$39, atm_apertura_maxima_mm=$40, atm_observaciones=$41,
        atm_musculos_dolor=$42, atm_musculos_dolor_grado=$43, atm_musculos_dolor_zona=$44,
        cuello_simetrico=$45, cuello_simetrico_obs=$46, cuello_movilidad_conservada=$47,
        cuello_movilidad_obs=$48, laringe_alineada=$49, laringe_alineada_obs=$50, cuello_otros=$51
       WHERE id_historia=$1`,
      p
    );
    return true;
  }
}

const examenRegionalRepository = new ExamenRegionalRepository();
export default examenRegionalRepository;
