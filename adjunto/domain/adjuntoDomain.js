const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

// Tipos MIME permitidos
const MIMES_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/dicom',
  'image/x-dicom',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export class AdjuntoAggregate {
  constructor({
    idHistoria,
    nombreOriginal,
    nombreStorage,
    tipoMime,
    tamanoBytes,
    descripcion,
    idUsuario,
  } = {}) {
    const s = String(idHistoria || '').trim();
    if (!s || !UUID_V4.test(s)) {
      throw new DomainError('id_historia inválido');
    }
    if (!nombreOriginal) {
      throw new DomainError('nombreOriginal requerido');
    }
    if (!nombreStorage) {
      throw new DomainError('nombreStorage requerido');
    }
    if (!MIMES_PERMITIDOS.includes(tipoMime)) {
      throw new DomainError(`Tipo de archivo no permitido: ${tipoMime}`);
    }
    if (tamanoBytes > MAX_BYTES) {
      throw new DomainError('Archivo supera el límite de 10 MB');
    }

    this.idHistoria = s;
    this.nombreOriginal = nombreOriginal;
    this.nombreStorage = nombreStorage;
    this.tipoMime = tipoMime;
    this.tamanoBytes = tamanoBytes;
    this.descripcion = descripcion || null;
    this.idUsuario = idUsuario || null;
  }
}

export class IAdjuntoRepository {
  async listarPorHistoria(_id) {
    throw new Error('no implementado');
  }
  async registrar(_agg) {
    throw new Error('no implementado');
  }
  async eliminar(_idAdjunto) {
    throw new Error('no implementado');
  }
  async obtenerUrlDescarga(_nombreStorage) {
    throw new Error('no implementado');
  }
}
