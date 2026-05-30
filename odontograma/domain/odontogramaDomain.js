const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

class IdHistoriaVO {
  constructor(v) {
    const s = String(v || '').trim();
    if (!s) {
      throw new DomainError('id_historia es requerido');
    }
    if (!UUID_V4.test(s)) {
      throw new DomainError('id_historia inválido');
    }
    this.value = s;
  }
}

class DienteVO {
  constructor(v) {
    const n = parseInt(v);
    // FDI: dientes permanentes 11-48, temporales 51-85
    if (isNaN(n) || n < 11 || n > 85) {
      throw new DomainError('numero_diente inválido (FDI 11-85)');
    }
    this.value = n;
  }
}

export class OdontogramaEntradaAggregate {
  constructor({
    idHistoria,
    numeroDiente,
    superficie,
    diagnostico,
    tratamiento,
    fecha,
    alumno,
    idUsuario,
  } = {}) {
    this._idHistoria = new IdHistoriaVO(idHistoria);
    this._diente = new DienteVO(numeroDiente);
    this._superficie = superficie ? String(superficie).trim() : null;
    this._diagnostico = diagnostico ? String(diagnostico).trim() : null;
    this._tratamiento = tratamiento ? String(tratamiento).trim() : null;
    this._fecha = fecha || null;
    this._alumno = alumno ? String(alumno).trim() : null;
    this._idUsuario = idUsuario || null;
  }

  obtenerParametros() {
    return [
      this._idHistoria.value,
      this._diente.value,
      this._superficie,
      this._diagnostico,
      this._tratamiento,
      this._fecha,
      this._alumno,
      this._idUsuario,
    ];
  }
}

export class IOdontogramaRepository {
  async listarPorHistoria(_idHistoria) {
    throw new Error('no implementado');
  }
  async registrarEntrada(_agg) {
    throw new Error('no implementado');
  }
  async eliminarEntrada(_idEntrada) {
    throw new Error('no implementado');
  }
}
