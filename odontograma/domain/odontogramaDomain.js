import { CODIGOS_HALLAZGO } from './hallazgosCatalogo.js';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Códigos que marcan una pieza como AUSENTE (no presente en boca):
//   DNE = no erupcionado · DEX = extraído/perdido · DAO = ausente otra causa.
// Regla de exclusión clínica (NTS-188 / ADR-0020, ADR-0021): una pieza ausente
// no puede tener otros hallazgos en el mismo odontograma.
export const CODIGOS_AUSENCIA = new Set(['DNE', 'DEX', 'DAO']);

/**
 * Valida la regla de exclusión por ausencia para una nueva entrada.
 * @param {string|null} codigoNuevo  Código del hallazgo a registrar (o null).
 * @param {string[]} codigosExistentes Códigos ya registrados para esa pieza/tipo.
 * @returns {{ ok: boolean, motivo?: string }}
 */
export function validarExclusionAusencia(codigoNuevo, codigosExistentes = []) {
  const hayAusenciaPrevia = codigosExistentes.some((c) =>
    CODIGOS_AUSENCIA.has(c)
  );
  const nuevoEsAusencia = CODIGOS_AUSENCIA.has(codigoNuevo);
  if (hayAusenciaPrevia && !nuevoEsAusencia) {
    return {
      ok: false,
      motivo:
        'La pieza está registrada como ausente (DNE/DEX/DAO) en este odontograma; no admite otros hallazgos. Elimina la marca de ausencia primero.',
    };
  }
  return { ok: true };
}

// Matriz de exclusión mutua: dentro de cada grupo, dos códigos DISTINTOS no
// pueden coexistir en la misma pieza y tipo de odontograma (son contradictorios).
// Conservadora a propósito: solo incompatibilidades clínicas inequívocas, para
// evitar falsos positivos que entorpezcan el registro.
export const GRUPOS_EXCLUSION_MUTUA = [
  // Anomalías de tamaño opuestas.
  { nombre: 'tamaño', codigos: ['MAC', 'MIC'] },
  // Dirección de giroversión opuesta.
  { nombre: 'giroversión', codigos: ['GV-D', 'GV-I'] },
  // Una pieza lleva a lo sumo un tipo de corona total.
  { nombre: 'corona', codigos: ['Co', 'Cv', 'Cmc', 'Clm', 'Ct'] },
];

/**
 * Valida TODAS las reglas de exclusión clínica para una nueva entrada:
 *  1) Pieza ausente (DNE/DEX/DAO) no admite otros hallazgos.
 *  2) Grupos de exclusión mutua (tamaño, giroversión, corona).
 * @param {string|null} codigoNuevo
 * @param {string[]} codigosExistentes  Códigos de la misma pieza y tipo.
 * @returns {{ ok: boolean, motivo?: string }}
 */
export function validarExclusion(codigoNuevo, codigosExistentes = []) {
  const ausencia = validarExclusionAusencia(codigoNuevo, codigosExistentes);
  if (!ausencia.ok) {
    return ausencia;
  }

  const grupo = GRUPOS_EXCLUSION_MUTUA.find((g) =>
    g.codigos.includes(codigoNuevo)
  );
  if (grupo) {
    const previo = codigosExistentes.find(
      (c) => grupo.codigos.includes(c) && c !== codigoNuevo
    );
    if (previo) {
      return {
        ok: false,
        motivo: `La pieza ya tiene "${previo}", incompatible con "${codigoNuevo}" (grupo: ${grupo.nombre}). Elimina el hallazgo previo primero.`,
      };
    }
  }
  return { ok: true };
}

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

// Hallazgo del catálogo oficial SIHCE/NTS-150. Opcional (null) para
// retrocompatibilidad con entradas previas de texto libre.
class HallazgoVO {
  constructor(v) {
    if (v === undefined || v === null || String(v).trim() === '') {
      this.value = null;
      return;
    }
    const s = String(v).trim();
    if (!CODIGOS_HALLAZGO.has(s)) {
      throw new DomainError(
        'codigo_hallazgo inválido (no está en el catálogo SIHCE/NTS-150)'
      );
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
    codigoHallazgo,
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
    this._hallazgo = new HallazgoVO(codigoHallazgo);
    this._idUsuario = idUsuario || null;
  }

  // Getters públicos para validaciones en la capa de aplicación.
  get numeroDiente() {
    return this._diente.value;
  }
  get tipo() {
    return this._tipo.value;
  }
  get codigoHallazgo() {
    return this._hallazgo.value;
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
      this._hallazgo.value,
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
