/**
 * Error de dominio para reglas invariantes del modulo de examen fisico regional.
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
 * Value Object para id de historia clinica UUID v4.
 */
export class IdHistoriaClinicaVO {
  /**
   * @param {string} value UUID v4.
   */
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new DomainError('id_historia invalido: debe ser UUIDv4');
    }

    const normalizedValue = value.trim().toLowerCase();
    const re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!re.test(normalizedValue)) {
      throw new DomainError('id_historia invalido: formato UUIDv4 esperado');
    }

    this.value = normalizedValue;
    Object.freeze(this);
  }
}

/**
 * Value Object para agudeza visual.
 */
export class AgudezaVisualVO {
  /**
   * @param {number|string|null|undefined} value
   */
  constructor(value) {
    if (value === null || value === undefined) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    const num = Number(value);
    if (Number.isNaN(num) || num <= 0 || num > 10) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    this.value = num;
    Object.freeze(this);
  }
}

/**
 * Value Object para apertura maxima de ATM.
 */
export class AperturaMaximaVO {
  /**
   * @param {number|string|null|undefined} value
   */
  constructor(value) {
    if (value === null || value === undefined) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    const num = Number(value);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    this.value = num;
    Object.freeze(this);
  }
}

/**
 * Value Object para grado de dolor muscular.
 */
export class MusculosDolorGradoVO {
  /**
   * @param {number|string|null|undefined} value
   */
  constructor(value) {
    if (value === null || value === undefined) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    const num = Number(value);
    if (Number.isNaN(num) || num < 0 || num > 10) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    this.value = num;
    Object.freeze(this);
  }
}

const normalizePrimitive = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? null : t;
  }
  return value;
};

/**
 * Aggregate Root del modulo de examen fisico regional.
 */
export class ExamenFisicoRegionalAggregate {
  #idHistoria;

  #campos;

  #ojosAgudezaVisual;

  #atmAperturaMaximaMm;

  #atmMusculosDolorGrado;

  /**
   * @param {Object} input
   */
  constructor({ id_historia, body = {} } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);

    this.#campos = Object.freeze({
      cabezaPosicion: normalizePrimitive(
        body.cabezaPosicion || body.cabeza_posicion
      ),
      cabezaMovimientos: normalizePrimitive(
        body.cabezaMovimientos || body.cabeza_movimientos
      ),
      cabezaMovimientosObs: normalizePrimitive(
        body.cabezaMovimientosObs || body.cabeza_movimientos_obs
      ),
      craneoTamano: normalizePrimitive(body.craneoTamano || body.craneo_tamano),
      craneoForma: normalizePrimitive(body.craneoForma || body.craneo_forma),
      caraFormaFrente: normalizePrimitive(
        body.caraFormaFrente || body.cara_forma_frente
      ),
      caraFormaPerfil: normalizePrimitive(
        body.caraFormaPerfil || body.cara_forma_perfil
      ),
      ojosCejasAdecuada: normalizePrimitive(
        body.ojosCejasAdecuada || body.ojos_cejas_adecuada
      ),
      ojosImplantacionObs: normalizePrimitive(
        body.ojosImplantacionObs || body.ojos_implantacion_obs
      ),
      ojosEscleroticas: normalizePrimitive(
        body.ojosEscleroticas || body.ojos_escleroticas
      ),
      ojosIrisColor: normalizePrimitive(
        body.ojosIrisColor || body.ojos_iris_color
      ),
      ojosArcoSenil: normalizePrimitive(
        body.ojosArcoSenil || body.ojos_arco_senil
      ),
      narizForma: normalizePrimitive(body.narizForma || body.nariz_forma),
      narizPermeables: normalizePrimitive(
        body.narizPermeables || body.nariz_permeables
      ),
      narizSecreciones: normalizePrimitive(
        body.narizSecreciones || body.nariz_secreciones
      ),
      narizSenosDolorosos: normalizePrimitive(
        body.narizSenosDolorosos || body.nariz_senos_dolorosos
      ),
      oidosAnomaliasMorfologicas: normalizePrimitive(
        body.oidosAnomaliasMorfologicas || body.oidos_anomalias_morfologicas
      ),
      oidosAnomaliasObs: normalizePrimitive(
        body.oidosAnomaliasObs || body.oidos_anomalias_obs
      ),
      oidosSecreciones: normalizePrimitive(
        body.oidosSecreciones || body.oidos_secreciones
      ),
      oidosAudicionConservada: normalizePrimitive(
        body.oidosAudicionConservada || body.oidos_audicion_conservada
      ),
      atmTrayectoria: normalizePrimitive(
        body.atmTrayectoria || body.atm_trayectoria
      ),
      atmLatIzqDolor: normalizePrimitive(
        body.atmLatIzqDolor || body.atm_lat_izq_dolor
      ),
      atmLatIzqRuido: normalizePrimitive(
        body.atmLatIzqRuido || body.atm_lat_izq_ruido
      ),
      atmLatIzqSalto: normalizePrimitive(
        body.atmLatIzqSalto || body.atm_lat_izq_salto
      ),
      atmLatDerDolor: normalizePrimitive(
        body.atmLatDerDolor || body.atm_lat_der_dolor
      ),
      atmLatDerRuido: normalizePrimitive(
        body.atmLatDerRuido || body.atm_lat_der_ruido
      ),
      atmLatDerSalto: normalizePrimitive(
        body.atmLatDerSalto || body.atm_lat_der_salto
      ),
      atmProtDolor: normalizePrimitive(
        body.atmProtDolor || body.atm_prot_dolor
      ),
      atmProtRuido: normalizePrimitive(
        body.atmProtRuido || body.atm_prot_ruido
      ),
      atmProtSalto: normalizePrimitive(
        body.atmProtSalto || body.atm_prot_salto
      ),
      atmAperDolor: normalizePrimitive(
        body.atmAperDolor || body.atm_aper_dolor
      ),
      atmAperRuido: normalizePrimitive(
        body.atmAperRuido || body.atm_aper_ruido
      ),
      atmAperSalto: normalizePrimitive(
        body.atmAperSalto || body.atm_aper_salto
      ),
      atmCierreDolor: normalizePrimitive(
        body.atmCierreDolor || body.atm_cierre_dolor
      ),
      atmCierreRuido: normalizePrimitive(
        body.atmCierreRuido || body.atm_cierre_ruido
      ),
      atmCierreSalto: normalizePrimitive(
        body.atmCierreSalto || body.atm_cierre_salto
      ),
      atmCoordinacionCondilar: normalizePrimitive(
        body.atmCoordinacionCondilar || body.atm_coordinacion_condilar
      ),
      atmObservaciones: normalizePrimitive(
        body.atmObservaciones || body.atm_observaciones
      ),
      atmMusculosDolor: normalizePrimitive(
        body.atmMusculosDolor || body.atm_musculos_dolor
      ),
      atmMusculosDolorZona: normalizePrimitive(
        body.atmMusculosDolorZona || body.atm_musculos_dolor_zona
      ),
      cuelloSimetrico: normalizePrimitive(
        body.cuelloSimetrico || body.cuello_simetrico
      ),
      cuelloSimetricoObs: normalizePrimitive(
        body.cuelloSimetricoObs || body.cuello_simetrico_obs
      ),
      cuelloMovilidadConservada: normalizePrimitive(
        body.cuelloMovilidadConservada || body.cuello_movilidad_conservada
      ),
      cuelloMovilidadObs: normalizePrimitive(
        body.cuelloMovilidadObs || body.cuello_movilidad_obs
      ),
      laringeAlineada: normalizePrimitive(
        body.laringeAlineada || body.laringe_alineada
      ),
      laringeAlineadaObs: normalizePrimitive(
        body.laringeAlineadaObs || body.laringe_alineada_obs
      ),
      cuelloOtros: normalizePrimitive(body.cuelloOtros || body.cuello_otros),
    });

    this.#ojosAgudezaVisual = new AgudezaVisualVO(
      body.ojosAgudezaVisual || body.ojos_agudeza_visual
    );
    this.#atmAperturaMaximaMm = new AperturaMaximaVO(
      body.atmAperturaMaximaMm || body.atm_apertura_maxima_mm
    );
    this.#atmMusculosDolorGrado = new MusculosDolorGradoVO(
      body.atmMusculosDolorGrado || body.atm_musculos_dolor_grado
    );

    Object.freeze(this);
  }

  /**
   * @returns {Array<unknown>}
   */
  obtenerParametros() {
    return [
      this.#idHistoria.value,
      this.#campos.cabezaPosicion,
      this.#campos.cabezaMovimientos,
      this.#campos.cabezaMovimientosObs,
      this.#campos.craneoTamano,
      this.#campos.craneoForma,
      this.#campos.caraFormaFrente,
      this.#campos.caraFormaPerfil,
      this.#campos.ojosCejasAdecuada,
      this.#campos.ojosImplantacionObs,
      this.#campos.ojosEscleroticas,
      this.#ojosAgudezaVisual.value,
      this.#campos.ojosIrisColor,
      this.#campos.ojosArcoSenil,
      this.#campos.narizForma,
      this.#campos.narizPermeables,
      this.#campos.narizSecreciones,
      this.#campos.narizSenosDolorosos,
      this.#campos.oidosAnomaliasMorfologicas,
      this.#campos.oidosAnomaliasObs,
      this.#campos.oidosSecreciones,
      this.#campos.oidosAudicionConservada,
      this.#campos.atmTrayectoria,
      this.#campos.atmLatIzqDolor,
      this.#campos.atmLatIzqRuido,
      this.#campos.atmLatIzqSalto,
      this.#campos.atmLatDerDolor,
      this.#campos.atmLatDerRuido,
      this.#campos.atmLatDerSalto,
      this.#campos.atmProtDolor,
      this.#campos.atmProtRuido,
      this.#campos.atmProtSalto,
      this.#campos.atmAperDolor,
      this.#campos.atmAperRuido,
      this.#campos.atmAperSalto,
      this.#campos.atmCierreDolor,
      this.#campos.atmCierreRuido,
      this.#campos.atmCierreSalto,
      this.#campos.atmCoordinacionCondilar,
      this.#atmAperturaMaximaMm.value,
      this.#campos.atmObservaciones,
      this.#campos.atmMusculosDolor,
      this.#atmMusculosDolorGrado.value,
      this.#campos.atmMusculosDolorZona,
      this.#campos.cuelloSimetrico,
      this.#campos.cuelloSimetricoObs,
      this.#campos.cuelloMovilidadConservada,
      this.#campos.cuelloMovilidadObs,
      this.#campos.laringeAlineada,
      this.#campos.laringeAlineadaObs,
      this.#campos.cuelloOtros,
    ];
  }

  get idHistoria() {
    return this.#idHistoria.value;
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Examen Físico Regional.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IExamenRegionalRepository {
  /**
   * Persiste un nuevo examen físico regional.
   * @param {ExamenFisicoRegionalAggregate} _agregado
   * @returns {Promise<Object|null>}
   * @abstract
   */
  async create(_agregado) {
    throw new Error('IExamenRegionalRepository.create() no implementado');
  }

  /**
   * Recupera el examen físico regional de una historia clínica.
   * @param {string} _idHistoria
   * @returns {Promise<Object|null>}
   * @abstract
   */
  async getByHistoria(_idHistoria) {
    throw new Error(
      'IExamenRegionalRepository.getByHistoria() no implementado'
    );
  }

  /**
   * Actualiza el examen físico regional de una historia clínica existente.
   * @param {ExamenFisicoRegionalAggregate} _agregado
   * @returns {Promise<boolean>}
   * @abstract
   */
  async update(_agregado) {
    throw new Error('IExamenRegionalRepository.update() no implementado');
  }
}
