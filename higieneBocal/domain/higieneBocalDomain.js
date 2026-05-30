class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainError';
  }
}

class IdHistoriaValueObject {
  constructor(value) {
    if (typeof value !== 'string') {
      throw new DomainError('id_historia inválido: debe ser una cadena UUIDv4');
    }
    const text = HigieneBocalAggregate._normalizeHistoryId(value);
    if (text === '') {
      throw new DomainError('id_historia inválido: debe ser una cadena UUIDv4');
    }
    const re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!re.test(text)) {
      throw new DomainError('id_historia inválido: formato UUIDv4 esperado');
    }
    this.value = text;
    Object.freeze(this);
  }
}

class EstadoHigieneValueObject {
  constructor(value) {
    if (value === null || value === undefined) {
      throw new DomainError('estadoHigiene inválido: no puede estar vacío');
    }
    const text = String(value).trim();
    if (text === '') {
      throw new DomainError('estadoHigiene inválido: no puede estar vacío');
    }
    this.value = text;
    Object.freeze(this);
  }
}

class HigieneBocalAggregate {
  constructor({ idHistory, body = {}, idUsuario } = {}) {
    this._idHistory = new IdHistoriaValueObject(idHistory);
    this._estadoHigiene = new EstadoHigieneValueObject(
      body.estadoHigiene ?? body.estado_higiene
    );
    this._idUsuario = HigieneBocalAggregate._normalizeIdUsuario(
      idUsuario ?? body.idUsuario ?? body.id_usuario
    );
  }

  static _normalizeHistoryId(value) {
    const text = String(value).trim();
    if (text.toUpperCase().startsWith('HC-')) {
      return text.slice(3).trim();
    }
    return text;
  }

  static _normalizeIdUsuario(value) {
    if (typeof value !== 'string') {
      throw new DomainError('idUsuario inválido: debe ser una cadena UUIDv4');
    }
    const text = value.trim();
    if (text === '') {
      throw new DomainError('idUsuario inválido: debe ser una cadena UUIDv4');
    }
    const re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!re.test(text)) {
      throw new DomainError('idUsuario inválido: formato UUIDv4 esperado');
    }
    return text;
  }

  obtenerParametros() {
    return [this._idHistory.value, this._estadoHigiene.value, this._idUsuario];
  }

  get estadoHigiene() {
    return this._estadoHigiene.value;
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Higiene Bucal.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IHigieneBocalRepository {
  /**
   * Recupera el estado de higiene bucal de una historia clínica.
   * @param {string} _idHistory
   * @returns {Promise<{estadoHigiene: string}|null>}
   * @abstract
   */
  async consultarPorHistoria(_idHistory) {
    throw new Error(
      'IHigieneBocalRepository.consultarPorHistoria() no implementado'
    );
  }

  /**
   * Persiste el examen de higiene bucal de una historia clínica.
   * @param {HigieneBocalAggregate} _dataOrAggregate
   * @returns {Promise<boolean>}
   * @abstract
   */
  async actualizarHigieneBocal(_dataOrAggregate) {
    throw new Error(
      'IHigieneBocalRepository.actualizarHigieneBocal() no implementado'
    );
  }
}

export { DomainError, HigieneBocalAggregate };
