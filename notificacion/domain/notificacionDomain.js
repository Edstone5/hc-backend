const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

const TIPOS = ['transfer', 'validacion', 'cita', 'evaluacion', 'sistema'];

export class NotificacionAggregate {
  constructor({ idDestinatario, titulo, mensaje, tipo, idReferencia } = {}) {
    const s = String(idDestinatario || '').trim();
    if (!s || !UUID_V4.test(s)) {
      throw new DomainError('idDestinatario inválido');
    }
    if (!titulo || !String(titulo).trim()) {
      throw new DomainError('titulo requerido');
    }
    if (!mensaje || !String(mensaje).trim()) {
      throw new DomainError('mensaje requerido');
    }
    if (!TIPOS.includes(tipo)) {
      throw new DomainError(`tipo debe ser: ${TIPOS.join(', ')}`);
    }

    this.idDestinatario = s;
    this.titulo = String(titulo).trim();
    this.mensaje = String(mensaje).trim();
    this.tipo = tipo;
    this.idReferencia = idReferencia || null;
  }
}

export class INotificacionRepository {
  async listarPorUsuario(_idUsuario) {
    throw new Error('no implementado');
  }
  async contarNoLeidas(_idUsuario) {
    throw new Error('no implementado');
  }
  async registrar(_agg) {
    throw new Error('no implementado');
  }
  async marcarLeida(_idNotif) {
    throw new Error('no implementado');
  }
  async marcarTodasLeidas(_idUsuario) {
    throw new Error('no implementado');
  }
}
