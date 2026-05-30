const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

const ESTADOS = ['programada', 'confirmada', 'cancelada', 'completada'];

export class CitaAggregate {
  constructor({
    idHistoria,
    idEstudiante,
    fechaHora,
    duracionMin,
    motivo,
    estado,
    idUsuario,
  } = {}) {
    for (const [k, v] of [
      ['idHistoria', idHistoria],
      ['idEstudiante', idEstudiante],
    ]) {
      const s = String(v || '').trim();
      if (!s || !UUID_V4.test(s)) {
        throw new DomainError(`${k} inválido`);
      }
    }
    if (!fechaHora) {
      throw new DomainError('fechaHora es requerida');
    }
    const dt = new Date(fechaHora);
    if (isNaN(dt.getTime())) {
      throw new DomainError('fechaHora formato inválido');
    }
    if (dt < new Date()) {
      throw new DomainError('No se pueden registrar citas en el pasado');
    }

    const dur = parseInt(duracionMin) || 60;
    if (dur < 15 || dur > 480) {
      throw new DomainError('duracionMin debe ser 15-480 minutos');
    }

    const est = estado || 'programada';
    if (!ESTADOS.includes(est)) {
      throw new DomainError(`estado debe ser: ${ESTADOS.join(', ')}`);
    }

    this.idHistoria = String(idHistoria).trim();
    this.idEstudiante = String(idEstudiante).trim();
    this.fechaHora = dt.toISOString();
    this.duracionMin = dur;
    this.motivo = motivo || null;
    this.estado = est;
    this.idUsuario = idUsuario || null;
  }
}

export class ICitaRepository {
  async listarPorHistoria(_id) {
    throw new Error('no implementado');
  }
  async listarPorEstudiante(_id, _desde, _hasta) {
    throw new Error('no implementado');
  }
  async verificarSolapamiento(
    _idEstudiante,
    _fechaInicio,
    _fechaFin,
    _excluirId
  ) {
    throw new Error('no implementado');
  }
  async registrar(_agg) {
    throw new Error('no implementado');
  }
  async actualizarEstado(_idCita, _estado) {
    throw new Error('no implementado');
  }
  async eliminar(_id) {
    throw new Error('no implementado');
  }
}
