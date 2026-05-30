/**
 * Error de dominio para reglas invariantes del modulo de antecedentes.
 */
export class DomainError extends Error {
  /**
   * @param {string} message Mensaje de error de dominio.
   */
  constructor(message) {
    super(message);
    this.name = 'DomainError';
    Object.freeze(this);
  }
}

/**
 * Value Object para identificadores clinicos UUID v4.
 */
export class IdHistoriaClinicaVO {
  /**
   * @param {string} value UUID de historia clinica.
   */
  constructor(value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new DomainError('El identificador clinico debe ser un UUID valido');
    }

    const normalizedValue = value.trim().toLowerCase();
    const uuidV4Pattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Pattern.test(normalizedValue)) {
      throw new DomainError('El identificador clinico debe ser un UUID valido');
    }

    this.value = normalizedValue;
    Object.freeze(this);
  }
}

/**
 * Value Object para enteros no negativos.
 */
export class EnteroNoNegativoVO {
  /**
   * @param {number|string|null|undefined} value Valor de entrada.
   * @param {string} mensajeError Mensaje cuando no cumple la regla.
   */
  constructor(value, mensajeError) {
    if (value === null || value === undefined || value === '') {
      this.value = null;
      Object.freeze(this);
      return;
    }

    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
      throw new DomainError(mensajeError);
    }

    this.value = parsedValue;
    Object.freeze(this);
  }
}

/**
 * Value Object para fechas clinicas.
 */
export class FechaClinicaVO {
  /**
   * @param {string|null|undefined} value Fecha de entrada.
   * @param {string} mensajeError Mensaje cuando no cumple la regla.
   */
  constructor(value, mensajeError) {
    if (value === null || value === undefined || value === '') {
      this.value = null;
      Object.freeze(this);
      return;
    }

    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) {
      throw new DomainError(mensajeError);
    }

    this.value = fecha.toISOString();
    Object.freeze(this);
  }
}

const normalizePrimitive = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return value;
};

/**
 * Aggregate Root para antecedentes personales no patologicos.
 */
export class AntecedentePersonalAggregate {
  #idHistoria;

  #campos;

  /**
   * @param {Object} input Datos del antecedente personal.
   */
  constructor({
    id_historia,
    esta_embarazada = null,
    mac = null,
    otros = null,
    psicosocial = null,
    vacunas = null,
    hepatitis_b = null,
    grupo_sanguineo_desc = null,
    fuma = null,
    cigarrillos_dia = null,
    toma_te = null,
    tazas_te_dia = null,
    toma_alcohol = null,
    frecuencia_alcohol = null,
    aprieta_dientes = null,
    momento_aprieta = null,
    rechina = null,
    dolor_muscular = null,
    chupa_dedo = null,
    muerde_objetos = null,
    muerde_labios = null,
    otros_habitos = null,
    frecuencia_cepillado = null,
    cepillo_duro = null,
    cepillo_mediano = null,
    cepillo_blando = null,
    cepillo_electrico = null,
    cepillo_interproximal = null,
    tipo_interproximal = null,
    seda_dental = null,
    enjuague_bucal = null,
    otros_elementos_higiene = null,
  } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);
    this.#campos = Object.freeze({
      estaEmbarazada: normalizePrimitive(esta_embarazada),
      mac: normalizePrimitive(mac),
      otros: normalizePrimitive(otros),
      psicosocial: normalizePrimitive(psicosocial),
      vacunas: normalizePrimitive(vacunas),
      hepatitisB: normalizePrimitive(hepatitis_b),
      grupoSanguineoDesc: normalizePrimitive(grupo_sanguineo_desc),
      fuma: normalizePrimitive(fuma),
      cigarrillosDia: normalizePrimitive(cigarrillos_dia),
      tomaTe: normalizePrimitive(toma_te),
      tazasTeDia: normalizePrimitive(tazas_te_dia),
      tomaAlcohol: normalizePrimitive(toma_alcohol),
      frecuenciaAlcohol: normalizePrimitive(frecuencia_alcohol),
      aprietaDientes: normalizePrimitive(aprieta_dientes),
      momentoAprieta: normalizePrimitive(momento_aprieta),
      rechina: normalizePrimitive(rechina),
      dolorMuscular: normalizePrimitive(dolor_muscular),
      chupaDedo: normalizePrimitive(chupa_dedo),
      muerdeObjetos: normalizePrimitive(muerde_objetos),
      muerdeLabios: normalizePrimitive(muerde_labios),
      otrosHabitos: normalizePrimitive(otros_habitos),
      frecuenciaCepillado: normalizePrimitive(frecuencia_cepillado),
      cepilloDuro: normalizePrimitive(cepillo_duro),
      cepilloMediano: normalizePrimitive(cepillo_mediano),
      cepilloBlando: normalizePrimitive(cepillo_blando),
      cepilloElectrico: normalizePrimitive(cepillo_electrico),
      cepilloInterproximal: normalizePrimitive(cepillo_interproximal),
      tipoInterproximal: normalizePrimitive(tipo_interproximal),
      sedaDental: normalizePrimitive(seda_dental),
      enjuagueBucal: normalizePrimitive(enjuague_bucal),
      otrosElementosHigiene: normalizePrimitive(otros_elementos_higiene),
    });

    Object.freeze(this);
  }

  /**
   * @returns {Array<unknown>}
   */
  obtenerParametros() {
    return [
      this.#idHistoria.value,
      this.#campos.estaEmbarazada,
      this.#campos.mac,
      this.#campos.otros,
      this.#campos.psicosocial,
      this.#campos.vacunas,
      this.#campos.hepatitisB,
      this.#campos.grupoSanguineoDesc,
      this.#campos.fuma,
      this.#campos.cigarrillosDia,
      this.#campos.tomaTe,
      this.#campos.tazasTeDia,
      this.#campos.tomaAlcohol,
      this.#campos.frecuenciaAlcohol,
      this.#campos.aprietaDientes,
      this.#campos.momentoAprieta,
      this.#campos.rechina,
      this.#campos.dolorMuscular,
      this.#campos.chupaDedo,
      this.#campos.muerdeObjetos,
      this.#campos.muerdeLabios,
      this.#campos.otrosHabitos,
      this.#campos.frecuenciaCepillado,
      this.#campos.cepilloDuro,
      this.#campos.cepilloMediano,
      this.#campos.cepilloBlando,
      this.#campos.cepilloElectrico,
      this.#campos.cepilloInterproximal,
      this.#campos.tipoInterproximal,
      this.#campos.sedaDental,
      this.#campos.enjuagueBucal,
      this.#campos.otrosElementosHigiene,
    ];
  }

  get idHistoria() {
    return this.#idHistoria.value;
  }
}

/**
 * Aggregate Root para antecedentes medicos.
 */
export class AntecedenteMedicoAggregate {
  #idHistoria;

  #campos;

  constructor({
    id_historia,
    salud_general = null,
    bajo_tratamiento = null,
    tipo_tratamiento = null,
    hospitalizaciones = null,
    tuvo_traumatismos = null,
    tipo_traumatismos = null,
    alergias = null,
    medicamentos_contraindicados = null,
    enf_hepatitis = null,
    enf_alergia_cronica = null,
    enf_corazon = null,
    enf_fiebre_reumatica = null,
    enf_anemia = null,
    enf_asma = null,
    enf_diabetes = null,
    enf_epilepsia = null,
    enf_coagulacion = null,
    enf_tbc = null,
    enf_hipertension = null,
    enf_ulcera = null,
    enf_neurologica = null,
    otras_enf_patologicas = null,
    odontologicos = null,
  } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);
    this.#campos = Object.freeze({
      saludGeneral: normalizePrimitive(salud_general),
      bajoTratamiento: normalizePrimitive(bajo_tratamiento),
      tipoTratamiento: normalizePrimitive(tipo_tratamiento),
      hospitalizaciones: normalizePrimitive(hospitalizaciones),
      tuvoTraumatismos: normalizePrimitive(tuvo_traumatismos),
      tipoTraumatismos: normalizePrimitive(tipo_traumatismos),
      alergias: normalizePrimitive(alergias),
      medicamentosContraindicados: normalizePrimitive(
        medicamentos_contraindicados
      ),
      enfHepatitis: normalizePrimitive(enf_hepatitis),
      enfAlergiaCronica: normalizePrimitive(enf_alergia_cronica),
      enfCorazon: normalizePrimitive(enf_corazon),
      enfFiebreReumatica: normalizePrimitive(enf_fiebre_reumatica),
      enfAnemia: normalizePrimitive(enf_anemia),
      enfAsma: normalizePrimitive(enf_asma),
      enfDiabetes: normalizePrimitive(enf_diabetes),
      enfEpilepsia: normalizePrimitive(enf_epilepsia),
      enfCoagulacion: normalizePrimitive(enf_coagulacion),
      enfTbc: normalizePrimitive(enf_tbc),
      enfHipertension: normalizePrimitive(enf_hipertension),
      enfUlcera: normalizePrimitive(enf_ulcera),
      enfNeurologica: normalizePrimitive(enf_neurologica),
      otrasEnfPatologicas: normalizePrimitive(otras_enf_patologicas),
      odontologicos: normalizePrimitive(odontologicos),
    });

    Object.freeze(this);
  }

  obtenerParametros() {
    return [
      this.#idHistoria.value,
      this.#campos.saludGeneral,
      this.#campos.bajoTratamiento,
      this.#campos.tipoTratamiento,
      this.#campos.hospitalizaciones,
      this.#campos.tuvoTraumatismos,
      this.#campos.tipoTraumatismos,
      this.#campos.alergias,
      this.#campos.medicamentosContraindicados,
      this.#campos.enfHepatitis,
      this.#campos.enfAlergiaCronica,
      this.#campos.enfCorazon,
      this.#campos.enfFiebreReumatica,
      this.#campos.enfAnemia,
      this.#campos.enfAsma,
      this.#campos.enfDiabetes,
      this.#campos.enfEpilepsia,
      this.#campos.enfCoagulacion,
      this.#campos.enfTbc,
      this.#campos.enfHipertension,
      this.#campos.enfUlcera,
      this.#campos.enfNeurologica,
      this.#campos.otrasEnfPatologicas,
      this.#campos.odontologicos,
    ];
  }

  get idHistoria() {
    return this.#idHistoria.value;
  }
}

/**
 * Aggregate Root para antecedentes heredo familiares.
 */
export class AntecedenteFamiliarAggregate {
  #idHistoria;

  #descripcion;

  constructor({ id_historia, descripcion = null } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);
    this.#descripcion = normalizePrimitive(descripcion);
    Object.freeze(this);
  }

  obtenerParametros() {
    return [this.#idHistoria.value, this.#descripcion];
  }

  get idHistoria() {
    return this.#idHistoria.value;
  }
}

/**
 * Aggregate Root para seguimiento del tratamiento.
 */
export class SeguimientoDelTratamientoAggregate {
  #idHistoria;

  #campos;

  #frecuenciaControlMeses;

  #frecuenciaLimpiezaMeses;

  #fechaConsentimiento;

  constructor({
    id_historia,
    motivo_dolor = null,
    motivo_control = null,
    frecuencia_control_meses = null,
    motivo_limpieza = null,
    frecuencia_limpieza_meses = null,
    actitud_tranquilo = null,
    actitud_aprensivo = null,
    actitud_panico = null,
    desagrado_atencion = null,
    fecha_consentimiento = null,
    firma_nombre = null,
    historia_elaborada_por = null,
  } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);
    this.#frecuenciaControlMeses = new EnteroNoNegativoVO(
      frecuencia_control_meses,
      'La frecuencia de control debe ser un entero no negativo'
    );
    this.#frecuenciaLimpiezaMeses = new EnteroNoNegativoVO(
      frecuencia_limpieza_meses,
      'La frecuencia de limpieza debe ser un entero no negativo'
    );
    this.#fechaConsentimiento = new FechaClinicaVO(
      fecha_consentimiento,
      'La fecha de consentimiento no tiene un formato valido'
    );
    this.#campos = Object.freeze({
      motivoDolor: normalizePrimitive(motivo_dolor),
      motivoControl: normalizePrimitive(motivo_control),
      motivoLimpieza: normalizePrimitive(motivo_limpieza),
      actitudTranquilo: normalizePrimitive(actitud_tranquilo),
      actitudAprensivo: normalizePrimitive(actitud_aprensivo),
      actitudPanico: normalizePrimitive(actitud_panico),
      desagradoAtencion: normalizePrimitive(desagrado_atencion),
      firmaNombre: normalizePrimitive(firma_nombre),
      historiaElaboradaPor: normalizePrimitive(historia_elaborada_por),
    });

    Object.freeze(this);
  }

  obtenerParametros() {
    return [
      this.#idHistoria.value,
      this.#campos.motivoDolor,
      this.#campos.motivoControl,
      this.#frecuenciaControlMeses.value,
      this.#campos.motivoLimpieza,
      this.#frecuenciaLimpiezaMeses.value,
      this.#campos.actitudTranquilo,
      this.#campos.actitudAprensivo,
      this.#campos.actitudPanico,
      this.#campos.desagradoAtencion,
      this.#fechaConsentimiento.value,
      this.#campos.firmaNombre,
      this.#campos.historiaElaboradaPor,
    ];
  }

  get idHistoria() {
    return this.#idHistoria.value;
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Antecedentes.
 * Cubre las cuatro secciones: personal, médico, familiar y cumplimiento.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IAntecedenteRepository {
  /** @abstract @param {AntecedentePersonalAggregate} _agregado @returns {Promise<boolean>} */
  async createAntecedentePersonal(_agregado) {
    throw new Error(
      'IAntecedenteRepository.createAntecedentePersonal() no implementado'
    );
  }
  /** @abstract @param {string} _idHistoria @returns {Promise<Object|undefined>} */
  async getAntecedentePersonalByHistoria(_idHistoria) {
    throw new Error(
      'IAntecedenteRepository.getAntecedentePersonalByHistoria() no implementado'
    );
  }
  /** @abstract @param {AntecedentePersonalAggregate} _agregado @returns {Promise<boolean>} */
  async updateAntecedentePersonal(_agregado) {
    throw new Error(
      'IAntecedenteRepository.updateAntecedentePersonal() no implementado'
    );
  }
  /** @abstract @param {AntecedenteMedicoAggregate} _agregado @returns {Promise<boolean>} */
  async createAntecedenteMedico(_agregado) {
    throw new Error(
      'IAntecedenteRepository.createAntecedenteMedico() no implementado'
    );
  }
  /** @abstract @param {string} _idHistoria @returns {Promise<Object|undefined>} */
  async getAntecedenteMedicoByHistoria(_idHistoria) {
    throw new Error(
      'IAntecedenteRepository.getAntecedenteMedicoByHistoria() no implementado'
    );
  }
  /** @abstract @param {AntecedenteMedicoAggregate} _agregado @returns {Promise<boolean>} */
  async updateAntecedenteMedico(_agregado) {
    throw new Error(
      'IAntecedenteRepository.updateAntecedenteMedico() no implementado'
    );
  }
  /** @abstract @param {AntecedenteFamiliarAggregate} _agregado @returns {Promise<boolean>} */
  async createAntecedenteFamiliar(_agregado) {
    throw new Error(
      'IAntecedenteRepository.createAntecedenteFamiliar() no implementado'
    );
  }
  /** @abstract @param {string} _idHistoria @returns {Promise<Object|undefined>} */
  async getAntecedenteFamiliarByHistoria(_idHistoria) {
    throw new Error(
      'IAntecedenteRepository.getAntecedenteFamiliarByHistoria() no implementado'
    );
  }
  /** @abstract @param {AntecedenteFamiliarAggregate} _agregado @returns {Promise<boolean>} */
  async updateAntecedenteFamiliar(_agregado) {
    throw new Error(
      'IAntecedenteRepository.updateAntecedenteFamiliar() no implementado'
    );
  }
  /** @abstract @param {SeguimientoDelTratamientoAggregate} _agregado @returns {Promise<boolean>} */
  async createAntecedenteCumplimiento(_agregado) {
    throw new Error(
      'IAntecedenteRepository.createAntecedenteCumplimiento() no implementado'
    );
  }
  /** @abstract @param {string} _idHistoria @returns {Promise<Object|undefined>} */
  async getAntecedenteCumplimientoByHistoria(_idHistoria) {
    throw new Error(
      'IAntecedenteRepository.getAntecedenteCumplimientoByHistoria() no implementado'
    );
  }
  /** @abstract @param {SeguimientoDelTratamientoAggregate} _agregado @returns {Promise<boolean>} */
  async updateAntecedenteCumplimiento(_agregado) {
    throw new Error(
      'IAntecedenteRepository.updateAntecedenteCumplimiento() no implementado'
    );
  }
}
