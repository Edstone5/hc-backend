const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

export class PrestamoEquipoAggregate {
  constructor({
    idEquipo,
    idEstudiante,
    fechaDevolucionPrevista,
    idAdmin,
  } = {}) {
    for (const [k, v] of [
      ['idEquipo', idEquipo],
      ['idEstudiante', idEstudiante],
    ]) {
      const s = String(v || '').trim();
      if (!s || !UUID_V4.test(s)) {
        throw new DomainError(`${k} inválido`);
      }
    }
    this.idEquipo = String(idEquipo).trim();
    this.idEstudiante = String(idEstudiante).trim();
    this.fechaDevolucionPrevista = fechaDevolucionPrevista || null;
    this.idAdmin = idAdmin || null;
  }
}

export class IPrestamoEquipoRepository {
  async listar(_filtros) {
    throw new Error('no implementado');
  }
  async registrar(_agg) {
    throw new Error('no implementado');
  }
  async devolver(_id) {
    throw new Error('no implementado');
  }
}
