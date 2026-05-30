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

class DienteVO {
  constructor(v) {
    const n = parseInt(v);
    // FDI: dientes permanentes 11-48, temporales 51-85
    if (isNaN(n) || n < 11 || n > 85) {
      throw new DomainError('numero_diente inválido (FDI 11-85)');
    }
    this.value = n;
  }
}

// Tipo de odontograma según RF-06 / NTS N° 150-MINSA:
//   INICIAL   → estado en que llegó el paciente (uno por historia)
//   EVOLUCION → cambios/tratamientos por sesión (varios por historia)
const TIPOS_VALIDOS = ['INICIAL', 'EVOLUCION'];

class TipoVO {
  constructor(v) {
    // Por compatibilidad con datos previos, el default es EVOLUCION.
    const s = String(v || 'EVOLUCION')
      .trim()
      .toUpperCase();
    if (!TIPOS_VALIDOS.includes(s)) {
      throw new DomainError('tipo inválido (INICIAL|EVOLUCION)');
    }
    this.value = s;
  }
}

export class OdontogramaEntradaAggregate {
  constructor({
    idHistoria,
    numeroDiente,
    superficie,
    diagnostico,
    tratamiento,
    fecha,
    alumno,
    tipo,
    idUsuario,
  } = {}) {
    this._idHistoria = new IdHistoriaVO(idHistoria);
    this._diente = new DienteVO(numeroDiente);
    this._superficie = superficie ? String(superficie).trim() : null;
    this._diagnostico = diagnostico ? String(diagnostico).trim() : null;
    this._tratamiento = tratamiento ? String(tratamiento).trim() : null;
    this._fecha = fecha || null;
    this._alumno = alumno ? String(alumno).trim() : null;
    this._tipo = new TipoVO(tipo);
    this._idUsuario = idUsuario || null;
  }

  obtenerParametros() {
    return [
      this._idHistoria.value,
      this._diente.value,
      this._superficie,
      this._diagnostico,
      this._tratamiento,
      this._fecha,
      this._alumno,
      this._tipo.value,
      this._idUsuario,
    ];
  }
}

// Aggregate del SVG serializado (enfoque híbrido RF-06).
// Persiste el dibujo completo del odontograma; complementa las entradas
// estructuradas de OdontogramaEntradaAggregate.
export class OdontogramaSvgAggregate {
  constructor({
    idHistoria,
    tipo,
    svg,
    especificaciones,
    observaciones,
    fecha,
    idUsuario,
  } = {}) {
    this._idHistoria = new IdHistoriaVO(idHistoria);
    this._tipo = new TipoVO(tipo);
    const svgStr = svg ? String(svg).trim() : '';
    if (!svgStr) {
      throw new DomainError('svg es requerido');
    }
    this._svg = svgStr;
    this._especificaciones = especificaciones
      ? String(especificaciones).trim()
      : null;
    this._observaciones = observaciones ? String(observaciones).trim() : null;
    this._fecha = fecha || null;
    this._idUsuario = idUsuario || null;
  }

  obtenerParametros() {
    return [
      this._idHistoria.value,
      this._tipo.value,
      this._svg,
      this._especificaciones,
      this._observaciones,
      this._fecha,
      this._idUsuario,
    ];
  }
}

export class IOdontogramaRepository {
  async listarPorHistoria(_idHistoria) {
    throw new Error('no implementado');
  }
  async registrarEntrada(_agg) {
    throw new Error('no implementado');
  }
  async eliminarEntrada(_idEntrada) {
    throw new Error('no implementado');
  }
  async listarSvgPorHistoria(_idHistoria, _tipo) {
    throw new Error('no implementado');
  }
  async guardarSvg(_agg) {
    throw new Error('no implementado');
  }
}
