/**
 * Error de dominio para reglas invariantes del modulo de examen fisico general.
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
 * Value Object para temperatura corporal.
 */
export class TemperaturaVO {
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
    if (Number.isNaN(num) || num < 30 || num > 45) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    this.value = num;
    Object.freeze(this);
  }
}

/**
 * Value Object para peso.
 */
export class PesoVO {
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
    if (Number.isNaN(num) || num <= 0 || num > 500) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    this.value = num;
    Object.freeze(this);
  }
}

/**
 * Value Object para presion arterial con formato sistolica/diastolica.
 */
export class PresionArterialVO {
  /**
   * @param {string|null|undefined} value
   */
  constructor(value) {
    if (value === null || value === undefined) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    const text = String(value).trim();
    const re = /^\d{2,3}\/\d{2,3}$/;
    if (!re.test(text)) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    this.value = text;
    Object.freeze(this);
  }
}

/**
 * Value Object para id de historia clinica UUID v4.
 */
export class IdHistoriaClinicaVO {
  /**
   * @param {string} value
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
 * Aggregate Root del modulo de examen fisico general.
 */
export class ExamenFisicoGeneralAggregate {
  #idHistoria;

  #campos;

  #temperatura;

  #presionArterial;

  #peso;

  /**
   * @param {Object} input
   */
  constructor({ id_historia, body = {} } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);

    this.#campos = Object.freeze({
      posicion: normalizePrimitive(body.posicion),
      actitud: normalizePrimitive(body.actitud),
      deambulacion: normalizePrimitive(body.deambulacion),
      facies: normalizePrimitive(body.facies),
      faciesObs: normalizePrimitive(body.faciesObs || body.facies_obs),
      conciencia: normalizePrimitive(body.conciencia),
      constitucion: normalizePrimitive(body.constitucion),
      estadoNutritivo: normalizePrimitive(
        body.estadoNutritivo || body.estado_nutritivo
      ),
      frecuenciaRespiratoria: normalizePrimitive(
        body.frecuenciaRespiratoria || body.frecuencia_respiratoria
      ),
      pulso: normalizePrimitive(body.pulso),
      talla: normalizePrimitive(body.talla),
      pielColor: normalizePrimitive(body.pielColor || body.piel_color),
      pielHumedad: normalizePrimitive(body.pielHumedad || body.piel_humedad),
      pielLesiones: normalizePrimitive(body.pielLesiones || body.piel_lesiones),
      pielLesionesObs: normalizePrimitive(
        body.pielLesionesObs || body.piel_lesiones_obs
      ),
      pielAnexos: normalizePrimitive(body.pielAnexos || body.piel_anexos),
      pielAnexosObs: normalizePrimitive(
        body.pielAnexosObs || body.piel_anexos_obs
      ),
      tcsDistribucion: normalizePrimitive(
        body.tcsDistribucion || body.tcs_distribucion
      ),
      tcsDistribucionObs: normalizePrimitive(
        body.tcsDistribucionObs || body.tcs_distribucion_obs
      ),
      tcsCantidad: normalizePrimitive(body.tcsCantidad || body.tcs_cantidad),
      ganglios: normalizePrimitive(body.ganglios),
      gangliosObs: normalizePrimitive(body.gangliosObs || body.ganglios_obs),
    });

    this.#temperatura = new TemperaturaVO(body.temperatura);
    this.#presionArterial = new PresionArterialVO(
      body.presionArterial || body.presion_arterial
    );
    this.#peso = new PesoVO(body.peso);

    Object.freeze(this);
  }

  /**
   * Respeta el orden posicional del procedimiento y del INSERT.
   * @returns {Array<unknown>}
   */
  obtenerParametros() {
    return [
      this.#idHistoria.value,
      this.#campos.posicion,
      this.#campos.actitud,
      this.#campos.deambulacion,
      this.#campos.facies,
      this.#campos.faciesObs,
      this.#campos.conciencia,
      this.#campos.constitucion,
      this.#campos.estadoNutritivo,
      this.#temperatura.value,
      this.#presionArterial.value,
      this.#campos.frecuenciaRespiratoria,
      this.#campos.pulso,
      this.#peso.value,
      this.#campos.talla,
      this.#campos.pielColor,
      this.#campos.pielHumedad,
      this.#campos.pielLesiones,
      this.#campos.pielLesionesObs,
      this.#campos.pielAnexos,
      this.#campos.pielAnexosObs,
      this.#campos.tcsDistribucion,
      this.#campos.tcsDistribucionObs,
      this.#campos.tcsCantidad,
      this.#campos.ganglios,
      this.#campos.gangliosObs,
    ];
  }

  get idHistoria() {
    return this.#idHistoria.value;
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Examen Físico General.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IExamenGeneralRepository {
  /**
   * Persiste un nuevo examen físico general.
   * @param {ExamenFisicoGeneralAggregate} _agregado
   * @returns {Promise<Object|null>}
   * @abstract
   */
  async create(_agregado) {
    throw new Error('IExamenGeneralRepository.create() no implementado');
  }

  /**
   * Recupera el examen físico general de una historia clínica.
   * @param {string} _idHistoria
   * @returns {Promise<Object|null>}
   * @abstract
   */
  async getByHistoria(_idHistoria) {
    throw new Error('IExamenGeneralRepository.getByHistoria() no implementado');
  }

  /**
   * Actualiza el examen físico general de una historia clínica existente.
   * @param {ExamenFisicoGeneralAggregate} _agregado
   * @returns {Promise<boolean>}
   * @abstract
   */
  async update(_agregado) {
    throw new Error('IExamenGeneralRepository.update() no implementado');
  }
}
