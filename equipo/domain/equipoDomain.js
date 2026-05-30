export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

export class EquipoAggregate {
  constructor({ nombre, descripcion, codigo, estado } = {}) {
    if (!nombre || !String(nombre).trim()) {
      throw new DomainError('nombre es requerido');
    }
    this.nombre = String(nombre).trim();
    this.descripcion = descripcion || null;
    this.codigo = codigo ? String(codigo).trim() : null;
    this.estado = estado || 'disponible';
  }
}

export class IEquipoRepository {
  async listar() {
    throw new Error('no implementado');
  }
  async obtenerPorId(_id) {
    throw new Error('no implementado');
  }
  async registrar(_agg) {
    throw new Error('no implementado');
  }
  async actualizar(_id, _agg) {
    throw new Error('no implementado');
  }
}
