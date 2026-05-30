const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

const ESTADOS = ['borrador', 'finalizado'];

export class FichaOperacionAggregate {
  constructor({
    idHistoria,
    diagnostico,
    procedimiento,
    materiales,
    observaciones,
    estado,
    fecha,
    alumno,
    idUsuario,
  } = {}) {
    const s = String(idHistoria || '').trim();
    if (!s || !UUID_V4.test(s)) {
      throw new DomainError('id_historia inválido');
    }
    if (!procedimiento || !String(procedimiento).trim()) {
      throw new DomainError('procedimiento es requerido');
    }
    const estadoVal = estado || 'borrador';
    if (!ESTADOS.includes(estadoVal)) {
      throw new DomainError(`estado debe ser: ${ESTADOS.join(', ')}`);
    }

    this.idHistoria = s;
    this.diagnostico = diagnostico || null;
    this.procedimiento = String(procedimiento).trim();
    this.materiales = materiales || null;
    this.observaciones = observaciones || null;
    this.estado = estadoVal;
    this.fecha = fecha || null;
    this.alumno = alumno || null;
    this.idUsuario = idUsuario || null;
  }

  obtenerParametros() {
    return [
      this.idHistoria,
      this.diagnostico,
      this.procedimiento,
      this.materiales,
      this.observaciones,
      this.estado,
      this.fecha,
      this.alumno,
      this.idUsuario,
    ];
  }
}

export class IFichaOperacionRepository {
  async listarPorHistoria(_id) {
    throw new Error('no implementado');
  }
  async obtenerPorId(_id) {
    throw new Error('no implementado');
  }
  async registrar(_agg) {
    throw new Error('no implementado');
  }
  async actualizar(_idFicha, _agg) {
    throw new Error('no implementado');
  }
  async eliminar(_id) {
    throw new Error('no implementado');
  }
}
