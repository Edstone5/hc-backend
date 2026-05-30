// Dominio del Examen Periodontal Básico (EPB / PSR — Periodontal Screening and
// Recording). La boca se divide en 6 sextantes; a cada uno se le asigna un
// código OMS 0-4, con marcadores opcionales de furca y movilidad.
//
// Códigos OMS:
//   0 sano · 1 sangrado · 2 cálculo/obturación desbordante ·
//   3 bolsa 3.5-5.5 mm · 4 bolsa ≥ 6 mm.

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

export const SEXTANTES = [1, 2, 3, 4, 5, 6];

class IdHistoriaVO {
  constructor(v) {
    const s = String(v || '').trim();
    const text = s.toUpperCase().startsWith('HC-') ? s.slice(3).trim() : s;
    if (!text || !UUID_V4.test(text)) {
      throw new DomainError('id_historia inválido (UUIDv4 esperado)');
    }
    this.value = text;
  }
}

export class EpbAggregate {
  constructor({ idHistoria, valores, fecha, idUsuario } = {}) {
    this._idHistoria = new IdHistoriaVO(idHistoria);

    if (!Array.isArray(valores) || valores.length === 0) {
      throw new DomainError('valores requerido (al menos un sextante)');
    }

    const sextantesVistos = new Set();
    let codigoMax = 0;
    const limpios = valores.map((item) => {
      const sextante = Number(item?.sextante);
      if (!SEXTANTES.includes(sextante)) {
        throw new DomainError(
          `sextante inválido: ${item?.sextante} (válidos: 1-6)`
        );
      }
      if (sextantesVistos.has(sextante)) {
        throw new DomainError(`sextante duplicado: ${sextante}`);
      }
      sextantesVistos.add(sextante);

      const codigo = Number(item?.codigo);
      if (!Number.isInteger(codigo) || codigo < 0 || codigo > 4) {
        throw new DomainError(
          `código OMS inválido en sextante ${sextante} (0-4)`
        );
      }
      codigoMax = Math.max(codigoMax, codigo);

      return {
        sextante,
        codigo,
        furca: Boolean(item?.furca),
        movilidad: Boolean(item?.movilidad),
      };
    });

    this._valores = limpios;
    this._codigoMax = codigoMax;
    this._fecha = fecha || null;
    this._idUsuario = idUsuario || null;
  }

  get resumen() {
    return { codigoMax: this._codigoMax };
  }

  obtenerParametros() {
    return [
      this._idHistoria.value,
      JSON.stringify(this._valores),
      this._codigoMax,
      this._fecha,
      this._idUsuario,
    ];
  }
}

export class IEpbRepository {
  async consultarPorHistoria(_idHistoria) {
    throw new Error('no implementado');
  }
  async guardar(_agg) {
    throw new Error('no implementado');
  }
}
