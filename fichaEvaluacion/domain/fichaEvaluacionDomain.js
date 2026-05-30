const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

const ESTADOS = ['pendiente', 'validado', 'requiere_correccion'];

export class FichaEvaluacionAggregate {
  constructor({
    idFicha,
    idHistoria,
    puntajeTotal,
    comentarios,
    estado,
    idDocente,
  } = {}) {
    for (const [campo, val] of [
      ['idFicha', idFicha],
      ['idHistoria', idHistoria],
    ]) {
      const s = String(val || '').trim();
      if (!s || !UUID_V4.test(s)) {
        throw new DomainError(`${campo} inválido`);
      }
    }
    const est = estado || 'pendiente';
    if (!ESTADOS.includes(est)) {
      throw new DomainError(`estado debe ser: ${ESTADOS.join(', ')}`);
    }
    if (puntajeTotal !== undefined && puntajeTotal !== null) {
      const n = Number(puntajeTotal);
      if (isNaN(n) || n < 0 || n > 100) {
        throw new DomainError('puntajeTotal debe ser 0-100');
      }
    }

    this.idFicha = String(idFicha).trim();
    this.idHistoria = String(idHistoria).trim();
    this.puntajeTotal =
      puntajeTotal !== null && puntajeTotal !== undefined
        ? parseFloat(Number(puntajeTotal).toFixed(2))
        : null;
    this.comentarios = comentarios || null;
    this.estado = est;
    this.idDocente = idDocente || null;
  }
}

export class IFichaEvaluacionRepository {
  async obtenerPorFicha(_idFicha) {
    throw new Error('no implementado');
  }
  async registrar(_agg) {
    throw new Error('no implementado');
  }
  async actualizar(_idEval, _agg) {
    throw new Error('no implementado');
  }
  async listarPorDocente(_idDocente) {
    throw new Error('no implementado');
  }
}
