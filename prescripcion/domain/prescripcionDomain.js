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

class MedicamentoVO {
  constructor(v) {
    const s = String(v || '').trim();
    if (!s) {
      throw new DomainError('medicamento es requerido');
    }
    this.value = s;
  }
}

export class PrescripcionAggregate {
  constructor({
    idHistoria,
    medicamento,
    dosis,
    duracion,
    fecha,
    prescriptor,
    idUsuario,
  } = {}) {
    this._idHistoria = new IdHistoriaVO(idHistoria);
    this._medicamento = new MedicamentoVO(medicamento);
    this._dosis = dosis ? String(dosis).trim() : null;
    this._duracion = duracion ? String(duracion).trim() : null;
    this._fecha = fecha || null;
    this._prescriptor = prescriptor ? String(prescriptor).trim() : null;
    this._idUsuario = idUsuario || null;
  }

  obtenerParametros() {
    return [
      this._idHistoria.value,
      this._medicamento.value,
      this._dosis,
      this._duracion,
      this._fecha,
      this._prescriptor,
      this._idUsuario,
    ];
  }
}

export class IPrescripcionRepository {
  async listarPorHistoria(_id) {
    throw new Error('no implementado');
  }
  async registrar(_agg) {
    throw new Error('no implementado');
  }
  async eliminar(_id) {
    throw new Error('no implementado');
  }
}
