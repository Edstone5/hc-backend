// Dominio del Índice de Higiene Oral Simplificado (IHO-S) de Greene y Vermillion.
// Se evalúan 6 dientes índice; cada uno con índice de detritos (DB, 0-3) y de
// cálculo (DC, 0-3). El IHO-S total = promedio(DB) + promedio(DC).
//
// Clasificación (Greene y Vermillion):
//   0.0 – 1.2  → Bueno
//   1.3 – 3.0  → Regular
//   3.1 – 6.0  → Malo

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class DomainError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DomainError';
  }
}

// Dientes índice estándar del IHO-S (notación FDI).
export const DIENTES_INDICE = [16, 11, 26, 36, 31, 46];

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

function valida0a3(v, etiqueta) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 3) {
    throw new DomainError(`${etiqueta} inválido (entero 0-3)`);
  }
  return n;
}

export function clasificarIhos(ihos) {
  if (ihos <= 1.2) {
    return 'Bueno';
  }
  if (ihos <= 3.0) {
    return 'Regular';
  }
  return 'Malo';
}

export class IhoSimplificadoAggregate {
  constructor({ idHistoria, valores, fecha, idUsuario } = {}) {
    this._idHistoria = new IdHistoriaVO(idHistoria);

    if (!Array.isArray(valores) || valores.length === 0) {
      throw new DomainError('valores requerido (al menos un diente índice)');
    }

    let sumaDb = 0;
    let sumaDc = 0;
    const limpios = valores.map((item) => {
      const diente = Number(item?.diente);
      if (!DIENTES_INDICE.includes(diente)) {
        throw new DomainError(
          `diente índice inválido: ${item?.diente} (válidos: ${DIENTES_INDICE.join(', ')})`
        );
      }
      const db = valida0a3(item?.db, `DB del diente ${diente}`);
      const dc = valida0a3(item?.dc, `DC del diente ${diente}`);
      sumaDb += db;
      sumaDc += dc;
      return { diente, db, dc };
    });

    const n = limpios.length;
    const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
    this._valores = limpios;
    this._idb = round2(sumaDb / n);
    this._icalc = round2(sumaDc / n);
    this._ihos = round2(this._idb + this._icalc);
    this._clasificacion = clasificarIhos(this._ihos);
    this._fecha = fecha || null;
    this._idUsuario = idUsuario || null;
  }

  get resumen() {
    return {
      idb: this._idb,
      icalc: this._icalc,
      ihos: this._ihos,
      clasificacion: this._clasificacion,
    };
  }

  obtenerParametros() {
    return [
      this._idHistoria.value,
      JSON.stringify(this._valores),
      this._idb,
      this._icalc,
      this._ihos,
      this._clasificacion,
      this._fecha,
      this._idUsuario,
    ];
  }
}

export class IIhoSimplificadoRepository {
  async consultarPorHistoria(_idHistoria) {
    throw new Error('no implementado');
  }
  async guardar(_agg) {
    throw new Error('no implementado');
  }
}
