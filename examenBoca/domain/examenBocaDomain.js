/**
 * Error de dominio para reglas invariantes del modulo de examen de boca.
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
    if (typeof value !== 'string') {
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
 * Value Object flexible para campos codificados/textuales.
 */
export class TextoClinicoOpcionalVO {
  /**
   * @param {unknown} value Valor del campo.
   */
  constructor(value) {
    if (value === null || value === undefined) {
      this.value = null;
      Object.freeze(this);
      return;
    }

    const text = String(value).trim();
    this.value = text === '' ? null : text;
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
 * Aggregate Root del modulo de examen de boca.
 */
export class ExamenBocaAggregate {
  #idHistoria;

  #campos;

  #oclusionMolarDer;

  #oclusionMolarIzq;

  #oclusionCaninaDer;

  #oclusionCaninaIzq;

  #oclusionOverbite;

  #oclusionOverjet;

  /**
   * @param {Object} input Datos del examen de boca.
   */
  constructor({ id_historia, body = {} } = {}) {
    this.#idHistoria = new IdHistoriaClinicaVO(id_historia);

    this.#campos = Object.freeze({
      labiosSin: normalizePrimitive(body.labiosSin || body.labios_sin_lesiones),
      labiosCon: normalizePrimitive(body.labiosCon || body.labios_con_lesiones),
      vestibuloSin: normalizePrimitive(
        body.vestibuloSin || body.vestibulo_sin_lesiones
      ),
      vestibuloCon: normalizePrimitive(
        body.vestibuloCon || body.vestibulo_con_lesiones
      ),
      carrillosSin: normalizePrimitive(
        body.carrillosSin || body.carrillos_retromolar_sin_lesiones
      ),
      carrillosCon: normalizePrimitive(
        body.carrillosCon || body.carrillos_retromolar_con_lesiones
      ),
      paladarSin: normalizePrimitive(
        body.paladarSin || body.paladar_sin_lesiones
      ),
      paladarCon: normalizePrimitive(
        body.paladarCon || body.paladar_con_lesiones
      ),
      orofaringeSin: normalizePrimitive(
        body.orofaringeSin || body.orofaringe_sin_lesiones
      ),
      orofaringeCon: normalizePrimitive(
        body.orofaringeCon || body.orofaringe_con_lesiones
      ),
      pisoBocaSin: normalizePrimitive(
        body.pisoBocaSin || body.piso_boca_sin_lesiones
      ),
      pisoBocaCon: normalizePrimitive(
        body.pisoBocaCon || body.piso_boca_con_lesiones
      ),
      lenguaSin: normalizePrimitive(body.lenguaSin || body.lengua_sin_lesiones),
      lenguaCon: normalizePrimitive(body.lenguaCon || body.lengua_con_lesiones),
      enciaSin: normalizePrimitive(body.enciaSin || body.encia_sin_lesiones),
      enciaCon: normalizePrimitive(body.enciaCon || body.encia_con_lesiones),
      oclusionMordidaCruzada: normalizePrimitive(
        body.oclusionMordidaCruzada || body.oclusion_mordida_cruzada
      ),
      oclusionVestibuloclusion: normalizePrimitive(
        body.oclusionVestibuloclusion || body.oclusion_vestibuloclusion
      ),
      oclusionMordidaAbierta: normalizePrimitive(
        body.oclusionMordidaAbierta || body.oclusion_mordida_abierta
      ),
      oclusionSobremordida: normalizePrimitive(
        body.oclusionSobremordida || body.oclusion_sobremordida
      ),
      oclusionVerticalOtros: normalizePrimitive(
        body.oclusionVerticalOtros || body.oclusion_relacion_vertical_otros
      ),
      oclusionProtrusion: normalizePrimitive(
        body.oclusionProtrusion || body.oclusion_protrusion
      ),
      oclusionGuiaIncisiva: normalizePrimitive(
        body.oclusionGuiaIncisiva || body.oclusion_guia_incisiva
      ),
      oclusionContactoPosterior: normalizePrimitive(
        body.oclusionContactoPosterior || body.oclusion_contacto_posterior
      ),
      latDerGuiaCanina: normalizePrimitive(
        body.latDerGuiaCanina || body.lat_der_guia_canina
      ),
      latDerFuncionGrupo: normalizePrimitive(
        body.latDerFuncionGrupo || body.lat_der_funcion_grupo
      ),
      latDerContactoBalance: normalizePrimitive(
        body.latDerContactoBalance || body.lat_der_contacto_balance
      ),
      latDerDescriba: normalizePrimitive(
        body.latDerDescriba || body.lat_der_describa
      ),
      latIzqGuiaCanina: normalizePrimitive(
        body.latIzqGuiaCanina || body.lat_izq_guia_canina
      ),
      latIzqFuncionGrupo: normalizePrimitive(
        body.latIzqFuncionGrupo || body.lat_izq_funcion_grupo
      ),
      latIzqContactoBalance: normalizePrimitive(
        body.latIzqContactoBalance || body.lat_izq_contacto_balance
      ),
      latIzqDescriba: normalizePrimitive(
        body.latIzqDescriba || body.lat_izq_describa
      ),
    });

    this.#oclusionMolarDer = new TextoClinicoOpcionalVO(
      body.oclusionMolarDer || body.oclusion_molar_der
    );
    this.#oclusionMolarIzq = new TextoClinicoOpcionalVO(
      body.oclusionMolarIzq || body.oclusion_molar_izq
    );
    this.#oclusionCaninaDer = new TextoClinicoOpcionalVO(
      body.oclusionCaninaDer || body.oclusion_canina_der
    );
    this.#oclusionCaninaIzq = new TextoClinicoOpcionalVO(
      body.oclusionCaninaIzq || body.oclusion_canina_izq
    );
    this.#oclusionOverbite = new TextoClinicoOpcionalVO(
      body.oclusionOverbite || body.oclusion_overbite
    );
    this.#oclusionOverjet = new TextoClinicoOpcionalVO(
      body.oclusionOverjet || body.oclusion_overjet
    );

    Object.freeze(this);
  }

  /**
   * @returns {Array<unknown>}
   */
  obtenerParametros() {
    return [
      this.#idHistoria.value,
      this.#campos.labiosSin,
      this.#campos.labiosCon,
      this.#campos.vestibuloSin,
      this.#campos.vestibuloCon,
      this.#campos.carrillosSin,
      this.#campos.carrillosCon,
      this.#campos.paladarSin,
      this.#campos.paladarCon,
      this.#campos.orofaringeSin,
      this.#campos.orofaringeCon,
      this.#campos.pisoBocaSin,
      this.#campos.pisoBocaCon,
      this.#campos.lenguaSin,
      this.#campos.lenguaCon,
      this.#campos.enciaSin,
      this.#campos.enciaCon,
      this.#oclusionMolarDer.value,
      this.#oclusionMolarIzq.value,
      this.#oclusionCaninaDer.value,
      this.#oclusionCaninaIzq.value,
      this.#campos.oclusionMordidaCruzada,
      this.#campos.oclusionVestibuloclusion,
      this.#oclusionOverbite.value,
      this.#campos.oclusionMordidaAbierta,
      this.#campos.oclusionSobremordida,
      this.#campos.oclusionVerticalOtros,
      this.#oclusionOverjet.value,
      this.#campos.oclusionProtrusion,
      this.#campos.oclusionGuiaIncisiva,
      this.#campos.oclusionContactoPosterior,
      this.#campos.latDerGuiaCanina,
      this.#campos.latDerFuncionGrupo,
      this.#campos.latDerContactoBalance,
      this.#campos.latDerDescriba,
      this.#campos.latIzqGuiaCanina,
      this.#campos.latIzqFuncionGrupo,
      this.#campos.latIzqContactoBalance,
      this.#campos.latIzqDescriba,
    ];
  }

  get idHistoria() {
    return this.#idHistoria.value;
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Examen Clínico de Boca.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IExamenBocaRepository {
  /**
   * Recupera el examen de boca de una historia clínica.
   * @param {string} _idHistoria
   * @returns {Promise<Object|null>}
   * @abstract
   */
  async getByHistoria(_idHistoria) {
    throw new Error('IExamenBocaRepository.getByHistoria() no implementado');
  }

  /**
   * Actualiza el examen de boca de una historia clínica.
   * @param {ExamenBocaAggregate} _agregado
   * @returns {Promise<boolean>}
   * @abstract
   */
  async update(_agregado) {
    throw new Error('IExamenBocaRepository.update() no implementado');
  }
}
