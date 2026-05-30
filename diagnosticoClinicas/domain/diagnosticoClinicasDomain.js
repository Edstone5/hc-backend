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
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new DomainError('fecha inválida');
    }
    this.value = d.toISOString().slice(0, 10);
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

class JSONValueObject {
  constructor(value) {
    if (value === null || value === undefined || value === '') {
      this.value = {};
      return;
    }
    if (typeof value === 'string') {
      try {
        this.value = JSON.parse(value);
        return;
      } catch (e) {
        throw new DomainError('JSON inválido');
      }
    }
    if (typeof value === 'object') {
      this.value = value;
      return;
    }
    throw new DomainError('JSON inválido');
  }
  toJSON() {
    return this.value;
  }
}

class DiagnosticoClinicasAggregate {
  constructor({ idHistory, data = {}, idUsuario } = {}) {
    this._idHistory =
      idHistory instanceof IdHistoriaValueObject
        ? idHistory
        : new IdHistoriaValueObject(idHistory);
    this._fechaRespuesta =
      data.fechaRespuesta instanceof FechaValueObject
        ? data.fechaRespuesta
        : new FechaValueObject(data.fechaRespuesta);
    this._clinicaRespuesta =
      data.clinicaRespuesta instanceof TextoValueObject
        ? data.clinicaRespuesta
        : new TextoValueObject(data.clinicaRespuesta);
    this._descripcionRespuesta =
      data.descripcionRespuesta instanceof TextoValueObject
        ? data.descripcionRespuesta
        : new TextoValueObject(data.descripcionRespuesta);
    this._examenes =
      data.examenes instanceof JSONValueObject
        ? data.examenes
        : new JSONValueObject(data.examenes);
    this._interconsultaTipo =
      data.interconsultaTipo instanceof TextoValueObject
        ? data.interconsultaTipo
        : new TextoValueObject(data.interconsultaTipo);
    this._interconsultaFecha =
      data.interconsultaFecha instanceof FechaValueObject
        ? data.interconsultaFecha
        : new FechaValueObject(data.interconsultaFecha);
    this._interconsultaClinica =
      data.interconsultaClinica instanceof TextoValueObject
        ? data.interconsultaClinica
        : new TextoValueObject(data.interconsultaClinica);
    this._diagnosticoDefinitivo =
      data.diagnosticoDefinitivo instanceof TextoValueObject
        ? data.diagnosticoDefinitivo
        : new TextoValueObject(data.diagnosticoDefinitivo);
    this._tratamiento =
      data.tratamiento instanceof TextoValueObject
        ? data.tratamiento
        : new TextoValueObject(data.tratamiento);
    this._pronostico =
      data.pronostico instanceof TextoValueObject
        ? data.pronostico
        : new TextoValueObject(data.pronostico);
    this._alumnoTratante =
      data.alumnoTratante instanceof TextoValueObject
        ? data.alumnoTratante
        : new TextoValueObject(data.alumnoTratante);
    this._idUsuario =
      idUsuario instanceof IdUsuarioValueObject
        ? idUsuario
        : new IdUsuarioValueObject(idUsuario);
  }
  obtenerParametros() {
    return [
      this._idHistory.toString(),
      this._fechaRespuesta.value,
      this._clinicaRespuesta.value,
      this._descripcionRespuesta.value,
      JSON.stringify(this._examenes.toJSON()),
      this._interconsultaTipo.value,
      this._interconsultaFecha.value,
      this._interconsultaClinica.value,
      this._diagnosticoDefinitivo.value,
      this._tratamiento.value,
      this._pronostico.value,
      this._alumnoTratante.value,
      this._idUsuario.toString(),
    ];
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Diagnóstico de Clínicas.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IDiagnosticoClinicasRepository {
  /**
   * Recupera el diagnóstico de clínicas de una historia (con fallback).
   * @param {string} _idHistory - UUID de la historia clínica.
   * @returns {Promise<Object|null>}
   * @abstract
   */
  async consultarPorHistoria(_idHistory) {
    throw new Error(
      'IDiagnosticoClinicasRepository.consultarPorHistoria() no implementado'
    );
  }

  /**
   * Persiste el diagnóstico definitivo de clínicas especializadas.
   * @param {DiagnosticoClinicasAggregate} _agregado - Aggregate Root validado.
   * @returns {Promise<boolean>}
   * @abstract
   */
  async actualizarDiagnosticoClinicas(_agregado) {
    throw new Error(
      'IDiagnosticoClinicasRepository.actualizarDiagnosticoClinicas() no implementado'
    );
  }
}

export { DomainError, DiagnosticoClinicasAggregate };
