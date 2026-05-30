/**
 * Error de dominio para reglas invariantes del modulo de enfermedad actual.
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
      throw new DomainError('La historia clinica debe ser un UUID v4 valido');
    }

    const normalizedValue = value.trim().toLowerCase();
    const uuidV4Pattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidV4Pattern.test(normalizedValue)) {
      throw new DomainError('La historia clinica debe ser un UUID v4 valido');
    }

    this.value = normalizedValue;
    Object.freeze(this);
  }
}

/**
 * Value Object para textos clinicos obligatorios.
 */
export class TextoClinicoObligatorioVO {
  /**
   * @param {unknown} value Valor textual.
   * @param {string} message Mensaje de validacion.
   */
  constructor(value, message) {
    if (value === null || value === undefined || value === '') {
      throw new DomainError(message);
    }

    const normalizedValue = String(value).trim();
    if (normalizedValue.length === 0) {
      throw new DomainError(message);
    }

    this.value = normalizedValue;
    Object.freeze(this);
  }
}

/**
 * Aggregate Root del modulo de enfermedad actual.
 */
export class EnfermedadActualAggregate {
  #idHistoria;

  #sintomaPrincipal;

  #tiempoEnfermedad;

  #formaInicio;

  #curso;

  #relato;

  #tratamientoPrev;

  /**
   * @param {Object} input Datos para el agregado de enfermedad actual.
   */
  constructor({
    id_historia,
    sintoma_principal,
    tiempo_enfermedad = null,
    forma_inicio = null,
    curso = null,
    relato = null,
    tratamiento_prev = null,
  } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);
    this.#sintomaPrincipal = new TextoClinicoObligatorioVO(
      sintoma_principal,
      'El sintoma principal es obligatorio'
    );
    this.#tiempoEnfermedad = this.#normalizeTextOptional(tiempo_enfermedad);
    this.#formaInicio = this.#normalizeTextOptional(forma_inicio);
    this.#curso = this.#normalizeTextOptional(curso);
    this.#relato = this.#normalizeTextOptional(relato);
    this.#tratamientoPrev = this.#normalizeTextOptional(tratamiento_prev);

    Object.freeze(this);
  }

  /**
   * @param {unknown} value Valor textual opcional.
   * @returns {string|null}
   */
  #normalizeTextOptional(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalizedValue = String(value).trim();
    return normalizedValue.length === 0 ? null : normalizedValue;
  }

  /**
   * Devuelve los parametros en orden posicional para procedimientos SQL.
   * @returns {Array<unknown>}
   */
  obtenerParametros() {
    return [
      this.#idHistoria.value,
      this.#sintomaPrincipal.value,
      this.#tiempoEnfermedad,
      this.#formaInicio,
      this.#curso,
      this.#relato,
      this.#tratamientoPrev,
    ];
  }

  /**
   * @returns {string}
   */
  get idHistoria() {
    return this.#idHistoria.value;
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Enfermedad Actual.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IEnfermedadActualRepository {
  /**
   * Persiste la enfermedad actual de una historia clínica.
   * @param {EnfermedadActualAggregate} _agregado
   * @returns {Promise<{success: boolean, id_historia: string}>}
   * @abstract
   */
  async create(_agregado) {
    throw new Error('IEnfermedadActualRepository.create() no implementado');
  }

  /**
   * Recupera la enfermedad actual de una historia clínica.
   * @param {string} _id_historia
   * @returns {Promise<Object|undefined>}
   * @abstract
   */
  async getByHistoria(_id_historia) {
    throw new Error(
      'IEnfermedadActualRepository.getByHistoria() no implementado'
    );
  }

  /**
   * Actualiza la enfermedad actual de una historia clínica existente.
   * @param {EnfermedadActualAggregate} _agregado
   * @returns {Promise<{success: boolean, id_historia: string}>}
   * @abstract
   */
  async update(_agregado) {
    throw new Error('IEnfermedadActualRepository.update() no implementado');
  }
}
