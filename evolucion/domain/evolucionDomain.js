class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainError';
  }
}

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function stripHCPrefix(id) {
  if (!id) {
    return id;
  }
  return id.startsWith('HC-') ? id.slice(3) : id;
}

class IdHistoriaValueObject {
  constructor(value) {
    const normalized = stripHCPrefix(String(value || '')).trim();
    if (!normalized) {
      throw new DomainError('id_historia es requerido');
    }
    if (!UUID_V4_REGEX.test(normalized)) {
      throw new DomainError('id_historia inválido');
    }
    this.value = normalized;
  }
  toString() {
    return this.value;
  }
}

class IdUsuarioValueObject {
  constructor(value) {
    if (!value) {
      throw new DomainError('idUsuario es requerido');
    }
    const normalized = String(value).trim();
    if (!UUID_V4_REGEX.test(normalized)) {
      throw new DomainError('idUsuario inválido');
    }
    this.value = normalized;
  }
  toString() {
    return this.value;
  }
}

class FechaValueObject {
  constructor(value) {
    if (value === null || value === undefined || value === '') {
      this.value = null;
      return;
    }
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) {
      throw new DomainError('fecha inválida');
    }
    this.value = fecha.toISOString().slice(0, 10);
  }
}

class TextoValueObject {
  constructor(value) {
    if (value === null || value === undefined) {
      this.value = null;
      return;
    }
    const normalized = String(value).trim();
    this.value = normalized === '' ? null : normalized;
  }
}

class EvolucionAggregate {
  constructor({ idHistory, fecha, actividad, alumno, idUsuario } = {}) {
    this._idHistory =
      idHistory instanceof IdHistoriaValueObject
        ? idHistory
        : new IdHistoriaValueObject(idHistory);
    this._fecha =
      fecha instanceof FechaValueObject ? fecha : new FechaValueObject(fecha);
    this._actividad =
      actividad instanceof TextoValueObject
        ? actividad
        : new TextoValueObject(actividad);
    this._alumno =
      alumno instanceof TextoValueObject
        ? alumno
        : new TextoValueObject(alumno);
    this._idUsuario =
      idUsuario instanceof IdUsuarioValueObject
        ? idUsuario
        : new IdUsuarioValueObject(idUsuario);
  }
  obtenerParametros() {
    return [
      this._idHistory.toString(),
      this._fecha.value,
      this._actividad.value,
      this._alumno.value,
      this._idUsuario.toString(),
    ];
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Evolución.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IEvolucionRepository {
  /**
   * Lista las evoluciones de una historia clínica ordenadas por fecha descendente.
   * @param {string} _idHistory - UUID de la historia clínica.
   * @returns {Promise<Array>}
   * @abstract
   */
  async consultarEvoluciones(_idHistory) {
    throw new Error(
      'IEvolucionRepository.consultarEvoluciones() no implementado'
    );
  }

  /**
   * Persiste una nueva evolución.
   * @param {EvolucionAggregate} _agregado - Aggregate Root validado del dominio.
   * @returns {Promise<boolean>}
   * @abstract
   */
  async registrarEvolucion(_agregado) {
    throw new Error(
      'IEvolucionRepository.registrarEvolucion() no implementado'
    );
  }
}

export { DomainError, EvolucionAggregate };
