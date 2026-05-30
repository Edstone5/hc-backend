const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainError';
  }
}

class IdHistoriaVO {
  constructor(value) {
    const v = String(value || '').trim();
    if (!v) {
      throw new DomainError('id_historia es requerido');
    }
    if (!UUID_V4_REGEX.test(v)) {
      throw new DomainError('id_historia inválido');
    }
    this.value = v;
  }
}

class MontoVO {
  constructor(value) {
    const n = Number(value);
    if (isNaN(n) || n <= 0) {
      throw new DomainError('monto debe ser un número positivo');
    }
    this.value = parseFloat(n.toFixed(2));
  }
}

export class PagoAggregate {
  constructor({ idHistoria, monto = 2.0, idAdmin } = {}) {
    this._idHistoria = new IdHistoriaVO(idHistoria);
    this._monto = new MontoVO(monto);
    this._idAdmin = idAdmin || null;
  }

  obtenerParametros() {
    return [this._idHistoria.value, this._monto.value, this._idAdmin];
  }
}

export class IPagoRepository {
  async registrarPago(_agregado) {
    throw new Error('IPagoRepository.registrarPago() no implementado');
  }
  async consultarPorHistoria(_idHistoria) {
    throw new Error('IPagoRepository.consultarPorHistoria() no implementado');
  }
}
