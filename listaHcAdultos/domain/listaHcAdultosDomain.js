/**
 * Dominio: ListaHcAdultos
 * Value Objects, DomainError y Aggregate Root.
 * No hay acceso a BD en este archivo.
 */

/**
 * Error de dominio para validar entradas
 */
class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainError';
    Object.freeze(this);
  }
}

/**
 * Expresión regular para UUID v4 (case-insensitive)
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * IdUuidValueObject
 * @class IdUuidValueObject
 */
class IdUuidValueObject {
  /**
   * @param {string} value UUID v4
   */
  constructor(value) {
    if (typeof value !== 'string' || !UUID_V4_REGEX.test(value)) {
      throw new DomainError('ID de estudiante inválido. Debe ser un UUID v4.');
    }
    this.value = value;
    Object.freeze(this);
  }
}

/**
 * Aggregate root: ListaHcAdultosAggregate
 */
class ListaHcAdultosAggregate {
  /**
   * @param {{idEstudianteVO: IdUuidValueObject}} param0
   */
  constructor({ idEstudianteVO } = {}) {
    if (!(idEstudianteVO instanceof IdUuidValueObject)) {
      throw new DomainError(
        'idEstudianteVO es requerido y debe ser IdUuidValueObject'
      );
    }
    this._idEstudiante = idEstudianteVO;
    Object.freeze(this);
  }

  /**
   * Retorna parámetros posicionales para llamadas a repositorio / BD
   * @returns {Array}
   */
  obtenerParametros() {
    return [this._idEstudiante.value];
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Lista HC Adultos.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IListaHcAdultosRepository {
  /**
   * Lista las historias clínicas de adultos asociadas a un estudiante.
   * @param {ListaHcAdultosAggregate} _aggregate
   * @returns {Promise<Array>}
   * @abstract
   */
  async listarPorEstudiante(_aggregate) {
    throw new Error(
      'IListaHcAdultosRepository.listarPorEstudiante() no implementado'
    );
  }
}

export { DomainError, IdUuidValueObject, ListaHcAdultosAggregate };
