const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

const ESTADOS = ['generado', 'enviado_validacion', 'validado'];

// El informe final compila el caso clínico completo (RF-13). Estas secciones
// son el mínimo sin el cual el documento no representa la intervención.
const SECCIONES_MINIMAS = ['encabezado', 'procedimientos', 'odontograma'];

// Secciones opcionales que, presentes, marcan el informe como completo para
// el cierre académico del caso.
const SECCIONES_CIERRE = ['medicamentos', 'adjuntos', 'evaluacionDocente'];

export class InformeFinalAggregate {
  constructor({ idHistoria, generadoPor, estado, secciones } = {}) {
    const hist = String(idHistoria || '').trim();
    if (!hist || !UUID_V4.test(hist)) {
      throw new DomainError('idHistoria inválido');
    }
    const autor = String(generadoPor || '').trim();
    if (!autor || !UUID_V4.test(autor)) {
      throw new DomainError('generadoPor inválido');
    }
    const est = estado || 'generado';
    if (!ESTADOS.includes(est)) {
      throw new DomainError(`estado debe ser: ${ESTADOS.join(', ')}`);
    }
    if (
      !secciones ||
      typeof secciones !== 'object' ||
      Array.isArray(secciones)
    ) {
      throw new DomainError(
        'secciones debe ser el contenido compilado del informe'
      );
    }
    for (const seccion of SECCIONES_MINIMAS) {
      if (
        secciones[seccion] === undefined ||
        secciones[seccion] === null ||
        secciones[seccion] === ''
      ) {
        throw new DomainError(
          `el informe debe compilar: ${SECCIONES_MINIMAS.join(', ')}`
        );
      }
    }
    if (!Array.isArray(secciones.procedimientos)) {
      throw new DomainError('procedimientos debe ser un listado');
    }

    this.idHistoria = hist;
    this.generadoPor = autor;
    this.estado = est;
    this.secciones = { ...secciones };
    this.fechaGeneracion = new Date().toISOString();
  }

  // Un informe está completo para el cierre académico cuando además de las
  // secciones mínimas incluye medicamentos, adjuntos y evaluación docente.
  esCompleto() {
    return SECCIONES_CIERRE.every(
      (s) =>
        this.secciones[s] !== undefined &&
        this.secciones[s] !== null &&
        this.secciones[s] !== ''
    );
  }

  // Transición de estado protegida: solo un informe recién generado puede
  // enviarse a validación docente.
  enviarParaValidacion() {
    if (this.estado === 'validado') {
      throw new DomainError('un informe validado no admite reenvío');
    }
    if (this.estado === 'enviado_validacion') {
      throw new DomainError('el informe ya fue enviado para validación');
    }
    this.estado = 'enviado_validacion';
    return this;
  }

  obtenerParametros() {
    return [
      this.idHistoria,
      this.generadoPor,
      this.estado,
      JSON.stringify(this.secciones),
      this.fechaGeneracion,
    ];
  }
}

export class IInformeFinalRepository {
  async registrar(_agg) {
    throw new Error('no implementado');
  }
  async listarPorHistoria(_idHistoria) {
    throw new Error('no implementado');
  }
  async obtenerPorId(_idInforme) {
    throw new Error('no implementado');
  }
  async actualizarEstado(_idInforme, _estado) {
    throw new Error('no implementado');
  }
}
