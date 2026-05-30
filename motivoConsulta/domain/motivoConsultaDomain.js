/**
 * Error de dominio para reglas invariantes del modulo de motivo de consulta.
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
 * Value Object para validar id_historia como UUID v4.
 */
export class IdHistoriaClinicaVO {
  /**
   * @param {string} value UUID v4 de la historia clinica.
   */
  constructor(value) {
    if (typeof value !== 'string') {
      throw new DomainError('id_historia debe ser un UUID valido');
    }

    const normalizedValue = value.trim().toLowerCase();
    const uuidV4Pattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidV4Pattern.test(normalizedValue)) {
      throw new DomainError('id_historia debe ser un UUID valido');
    }

    this.value = normalizedValue;
    Object.freeze(this);
  }
}

/**
 * Value Object para texto clinico obligatorio de motivo.
 */
export class MotivoConsultaVO {
  /**
   * @param {unknown} value Texto de motivo.
   */
  constructor(value) {
    if (typeof value !== 'string') {
      throw new DomainError('motivo debe ser una cadena de texto');
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new DomainError('motivo no puede estar vacio');
    }

    this.value = trimmed;
    Object.freeze(this);
  }
}

/**
 * Aggregate Root del modulo de motivo de consulta.
 */
export class MotivoConsultaAggregate {
  #idHistoria;

  #motivo;

  /**
   * @param {Object} input Datos para el agregado de motivo de consulta.
   */
  constructor({ id_historia, motivo } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);
    this.#motivo = new MotivoConsultaVO(motivo);

    Object.freeze(this);
  }

  /**
   * Devuelve los parametros en orden posicional para procedimientos SQL.
   * @returns {Array<unknown>}
   */
  obtenerParametros() {
    return [this.#idHistoria.value, this.#motivo.value];
  }

  /**
   * @returns {string}
   */
  get idHistoria() {
    return this.#idHistoria.value;
  }

  /**
   * @returns {string}
   */
  get motivo() {
    return this.#motivo.value;
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Motivo de Consulta.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IMotivoConsultaRepository {
  /**
   * Persiste el motivo de consulta de una historia clínica.
   * @param {MotivoConsultaAggregate} _agregado
   * @returns {Promise<boolean>}
   * @abstract
   */
  async create(_agregado) {
    throw new Error('IMotivoConsultaRepository.create() no implementado');
  }

  /**
   * Recupera el motivo de consulta de una historia clínica.
   * @param {string} _id_historia
   * @returns {Promise<Object|undefined>}
   * @abstract
   */
  async getByHistoria(_id_historia) {
    throw new Error(
      'IMotivoConsultaRepository.getByHistoria() no implementado'
    );
  }

  /**
   * Actualiza el motivo de consulta de una historia clínica existente.
   * @param {MotivoConsultaAggregate} _agregado
   * @returns {Promise<boolean>}
   * @abstract
   */
  async update(_agregado) {
    throw new Error('IMotivoConsultaRepository.update() no implementado');
  }
}
