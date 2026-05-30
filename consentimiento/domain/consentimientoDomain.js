/**
 * Capa de Dominio — ConsentimientoInformado
 *
 * RF-09: El sistema debe permitir seleccionar un formato de consentimiento
 * (adulto, menor de edad, cirugía, anestesia), completar los datos del paciente
 * y exportar/imprimir el documento.
 *
 * Tipos de template disponibles (alineados con Anexo 6):
 *   - 'adulto_general'   : Procedimientos generales en adulto
 *   - 'cirugia_oral'     : Cirugía oral y exodoncias
 *   - 'menor_de_edad'    : Paciente menor — requiere nombre del tutor
 *   - 'anestesia_local'  : Consentimiento específico para anestesia local
 *
 * Decisión: un mismo id_historia puede tener múltiples consentimientos
 * (uno por procedimiento relevante). No se restringe a uno único.
 */

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TIPOS_VALIDOS = [
  'adulto_general',
  'cirugia_oral',
  'menor_de_edad',
  'anestesia_local',
];

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

// ── Value Objects ─────────────────────────────────────────────────────────────

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

class TipoTemplateVO {
  constructor(v) {
    const s = String(v || '').trim();
    if (!s) {
      throw new DomainError('tipo_template es requerido');
    }
    if (!TIPOS_VALIDOS.includes(s)) {
      throw new DomainError(
        `tipo_template debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`
      );
    }
    this.value = s;
  }
}

class NombrePacienteVO {
  constructor(v) {
    const s = String(v || '').trim();
    if (!s) {
      throw new DomainError('nombre_paciente es requerido');
    }
    if (s.length > 300) {
      throw new DomainError('nombre_paciente excede 300 caracteres');
    }
    this.value = s;
  }
}

// ── Agregados ─────────────────────────────────────────────────────────────────

export class ConsentimientoAggregate {
  constructor({
    idHistoria,
    tipoTemplate,
    nombrePaciente,
    nombreResponsable,
    fechaConsentimiento,
    idUsuario,
  } = {}) {
    this._idHistoria = new IdHistoriaVO(idHistoria);
    this._tipoTemplate = new TipoTemplateVO(tipoTemplate);
    this._nombrePaciente = new NombrePacienteVO(nombrePaciente);
    this._nombreResponsable = nombreResponsable
      ? String(nombreResponsable).trim().slice(0, 300)
      : null;
    this._fechaConsentimiento = fechaConsentimiento || null;
    this._idUsuario = idUsuario || null;
  }

  obtenerParametros() {
    return [
      this._idHistoria.value,
      this._tipoTemplate.value,
      this._nombrePaciente.value,
      this._nombreResponsable,
      this._fechaConsentimiento,
      this._idUsuario,
    ];
  }
}

// ── Interfaz del repositorio ──────────────────────────────────────────────────

export class IConsentimientoRepository {
  async listarPorHistoria(_idHistoria) {
    throw new Error('no implementado');
  }
  async registrar(_aggregate) {
    throw new Error('no implementado');
  }
  async eliminar(_idConsentimiento) {
    throw new Error('no implementado');
  }
}
