/**
 * Error de dominio para reglas invariantes del modulo de filiacion.
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
 * Value Object para validar edad clinica.
 */
export class EdadClinicaVO {
  /**
   * @param {number|string|null|undefined} value Edad del paciente.
   */
  constructor(value) {
    if (value === null || value === undefined || value === '') {
      this.value = null;
      Object.freeze(this);
      return;
    }

    const parsedValue = Number(value);
    if (
      !Number.isInteger(parsedValue) ||
      parsedValue < 0 ||
      parsedValue > 130
    ) {
      throw new DomainError('La edad clinica debe ser un entero entre 0 y 130');
    }

    this.value = parsedValue;
    Object.freeze(this);
  }
}

/**
 * Value Object para fechas clinicas serializadas en ISO 8601.
 */
export class FechaClinicaVO {
  /**
   * @param {string|null|undefined} value Fecha de entrada.
   * @param {string} mensajeError Mensaje de error de validacion.
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

/**
 * Aggregate Root del modulo de filiacion.
 */
export class FiliacionAggregate {
  #idHistoria;

  #raza;

  #fechaNacimiento;

  #lugar;

  #estadoCivil;

  #nombreConyuge;

  #ocupacion;

  #lugarProcedencia;

  #tiempoResidenciaTacna;

  #direccion;

  #ultimaVisitaDentista;

  #motivoVisitaDentista;

  #ultimaVisitaMedico;

  #motivoVisitaMedico;

  #contactoEmergencia;

  #telefonoEmergencia;

  #acompaniante;

  #edad;

  #sexo;

  #fechaElaboracion;

  /**
   * @param {Object} input Datos para el agregado de filiacion.
   */
  constructor({
    id_historia,
    raza = null,
    fecha_nacimiento = null,
    lugar = null,
    estado_civil = null,
    nombre_conyuge = null,
    ocupacion = null,
    lugar_procedencia = null,
    tiempo_residencia_tacna = null,
    direccion = null,
    ultima_visita_dentista = null,
    motivo_visita_dentista = null,
    ultima_visita_medico = null,
    motivo_visita_medico = null,
    contacto_emergencia = null,
    telefono_emergencia = null,
    acompaniante = null,
    edad = null,
    sexo = null,
    fecha_elaboracion = null,
  } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);
    this.#raza = this.#normalizeText(raza);
    this.#fechaNacimiento = new FechaClinicaVO(
      fecha_nacimiento,
      'La fecha de nacimiento no tiene un formato valido'
    );
    this.#lugar = this.#normalizeText(lugar);
    this.#estadoCivil = this.#normalizeText(estado_civil);
    this.#nombreConyuge = this.#normalizeText(nombre_conyuge);
    this.#ocupacion = this.#normalizeText(ocupacion);
    this.#lugarProcedencia = this.#normalizeText(lugar_procedencia);
    this.#tiempoResidenciaTacna = this.#normalizeText(tiempo_residencia_tacna);
    this.#direccion = this.#normalizeText(direccion);
    this.#ultimaVisitaDentista = this.#normalizeText(ultima_visita_dentista);
    this.#motivoVisitaDentista = this.#normalizeText(motivo_visita_dentista);
    this.#ultimaVisitaMedico = this.#normalizeText(ultima_visita_medico);
    this.#motivoVisitaMedico = this.#normalizeText(motivo_visita_medico);
    this.#contactoEmergencia = this.#normalizeText(contacto_emergencia);
    this.#telefonoEmergencia = this.#normalizeText(telefono_emergencia);
    this.#acompaniante = this.#normalizeText(acompaniante);
    this.#edad = new EdadClinicaVO(edad);
    this.#sexo = this.#normalizeSexo(sexo);
    this.#fechaElaboracion = new FechaClinicaVO(
      fecha_elaboracion,
      'La fecha de elaboracion no tiene un formato valido'
    );

    Object.freeze(this);
  }

  /**
   * @param {unknown} value Valor textual de entrada.
   * @returns {string|null}
   */
  #normalizeText(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return String(value).trim();
  }

  /**
   * @param {unknown} value Valor de sexo de entrada.
   * @returns {string|null}
   */
  #normalizeSexo(value) {
    const normalizedValue = this.#normalizeText(value);
    if (normalizedValue === null) {
      return null;
    }

    const allowedValues = ['M', 'F', 'Masculino', 'Femenino', 'O'];
    if (!allowedValues.includes(normalizedValue)) {
      throw new DomainError('El sexo clinico no tiene un valor permitido');
    }

    return normalizedValue;
  }

  /**
   * Devuelve los parametros en orden posicional para procedimientos SQL.
   * @returns {Array<unknown>}
   */
  obtenerParametros() {
    return [
      this.#idHistoria.value,
      this.#raza,
      this.#fechaNacimiento.value,
      this.#lugar,
      this.#estadoCivil,
      this.#nombreConyuge,
      this.#ocupacion,
      this.#lugarProcedencia,
      this.#tiempoResidenciaTacna,
      this.#direccion,
      this.#ultimaVisitaDentista,
      this.#motivoVisitaDentista,
      this.#ultimaVisitaMedico,
      this.#motivoVisitaMedico,
      this.#contactoEmergencia,
      this.#telefonoEmergencia,
      this.#acompaniante,
      this.#edad.value,
      this.#sexo,
      this.#fechaElaboracion.value,
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
 * Contrato del adaptador secundario de Filiación.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IFiliacionRepository {
  /**
   * Persiste una nueva filiación.
   * @param {FiliacionAggregate} _agregado
   * @returns {Promise<{success: boolean, id_historia: string}>}
   * @abstract
   */
  async create(_agregado) {
    throw new Error('IFiliacionRepository.create() no implementado');
  }

  /**
   * Recupera la filiación de una historia clínica.
   * @param {string} _id_historia
   * @returns {Promise<Object|undefined>}
   * @abstract
   */
  async getByHistoria(_id_historia) {
    throw new Error('IFiliacionRepository.getByHistoria() no implementado');
  }

  /**
   * Actualiza la filiación de una historia clínica existente.
   * @param {FiliacionAggregate} _agregado
   * @returns {Promise<{success: boolean, id_historia: string}>}
   * @abstract
   */
  async update(_agregado) {
    throw new Error('IFiliacionRepository.update() no implementado');
  }
}
