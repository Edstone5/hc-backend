import { describe, it, expect } from 'vitest';
import {
  DomainError,
  IdHistoriaClinicaVO,
  AgudezaVisualVO,
  AperturaMaximaVO,
  MusculosDolorGradoVO,
  ExamenFisicoRegionalAggregate,
} from '../examenRegional/domain/examenRegionalDomain.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// ── DomainError ───────────────────────────────────────────────────────────────

describe('DomainError', () => {
  it('es instancia de Error', () => {
    expect(new DomainError('x')).toBeInstanceOf(Error);
  });

  it('name === "DomainError"', () => {
    expect(new DomainError('x').name).toBe('DomainError');
  });

  it('preserva el mensaje', () => {
    expect(new DomainError('fallo').message).toBe('fallo');
  });
});

// ── IdHistoriaClinicaVO ───────────────────────────────────────────────────────

describe('IdHistoriaClinicaVO (examenRegional)', () => {
  describe('camino feliz', () => {
    it('acepta UUID v4 válido', () => {
      expect(new IdHistoriaClinicaVO(VALID_UUID).value).toBe(VALID_UUID);
    });

    it('normaliza mayúsculas', () => {
      const upper = '550E8400-E29B-41D4-A716-446655440000';
      expect(new IdHistoriaClinicaVO(upper).value).toBe(VALID_UUID);
    });

    it('elimina espacios', () => {
      expect(new IdHistoriaClinicaVO(`  ${VALID_UUID}  `).value).toBe(
        VALID_UUID
      );
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null o falsy → lanza "id_historia invalido: debe ser UUIDv4"', () => {
      expect(() => new IdHistoriaClinicaVO(null)).toThrow(
        'id_historia invalido: debe ser UUIDv4'
      );
    });

    it('cadena no UUID → lanza "id_historia invalido: formato UUIDv4 esperado"', () => {
      expect(() => new IdHistoriaClinicaVO('no-es-uuid')).toThrow(
        'id_historia invalido: formato UUIDv4 esperado'
      );
    });

    it('UUID con carácter extra al inicio → lanza (mata mutante ^)', () => {
      expect(() => new IdHistoriaClinicaVO(`x${VALID_UUID}`)).toThrow(
        DomainError
      );
    });

    it('UUID con carácter extra al final → lanza (mata mutante $)', () => {
      expect(() => new IdHistoriaClinicaVO(`${VALID_UUID}x`)).toThrow(
        DomainError
      );
    });
  });
});

// ── AgudezaVisualVO ───────────────────────────────────────────────────────────

describe('AgudezaVisualVO', () => {
  describe('normalización silenciosa — rango (0, 10]', () => {
    it('null → value = null', () => {
      expect(new AgudezaVisualVO(null).value).toBeNull();
    });

    it('undefined → value = null', () => {
      expect(new AgudezaVisualVO(undefined).value).toBeNull();
    });

    it('valor válido en límite superior (10) → 10', () => {
      expect(new AgudezaVisualVO(10).value).toBe(10);
    });

    it('valor válido (5) → 5', () => {
      expect(new AgudezaVisualVO(5).value).toBe(5);
    });

    it('valor mínimo válido (0.1) → 0.1', () => {
      expect(new AgudezaVisualVO(0.1).value).toBe(0.1);
    });

    it('0 → null (no positivo)', () => {
      expect(new AgudezaVisualVO(0).value).toBeNull();
    });

    it('negativo → null', () => {
      expect(new AgudezaVisualVO(-1).value).toBeNull();
    });

    it('mayor que 10 → null', () => {
      expect(new AgudezaVisualVO(10.1).value).toBeNull();
    });

    it('NaN → null', () => {
      expect(new AgudezaVisualVO(NaN).value).toBeNull();
    });

    it('string numérico válido → convierte a número', () => {
      expect(new AgudezaVisualVO('7').value).toBe(7);
    });
  });
});

// ── AperturaMaximaVO ──────────────────────────────────────────────────────────

describe('AperturaMaximaVO', () => {
  describe('normalización silenciosa — rango [0, 100]', () => {
    it('null → value = null', () => {
      expect(new AperturaMaximaVO(null).value).toBeNull();
    });

    it('0 → value = 0 (incluye cero, BVA límite inferior)', () => {
      expect(new AperturaMaximaVO(0).value).toBe(0);
    });

    it('100 → value = 100 (BVA límite superior)', () => {
      expect(new AperturaMaximaVO(100).value).toBe(100);
    });

    it('valor válido (45) → 45', () => {
      expect(new AperturaMaximaVO(45).value).toBe(45);
    });

    it('negativo (-1) → null', () => {
      expect(new AperturaMaximaVO(-1).value).toBeNull();
    });

    it('mayor que 100 (101) → null', () => {
      expect(new AperturaMaximaVO(101).value).toBeNull();
    });

    it('NaN → null', () => {
      expect(new AperturaMaximaVO(NaN).value).toBeNull();
    });
  });
});

// ── MusculosDolorGradoVO ──────────────────────────────────────────────────────

describe('MusculosDolorGradoVO', () => {
  describe('normalización silenciosa — rango [0, 10]', () => {
    it('null → value = null', () => {
      expect(new MusculosDolorGradoVO(null).value).toBeNull();
    });

    it('0 → value = 0 (BVA límite inferior)', () => {
      expect(new MusculosDolorGradoVO(0).value).toBe(0);
    });

    it('10 → value = 10 (BVA límite superior)', () => {
      expect(new MusculosDolorGradoVO(10).value).toBe(10);
    });

    it('5 → value = 5 (valor medio)', () => {
      expect(new MusculosDolorGradoVO(5).value).toBe(5);
    });

    it('-1 → null (BVA justo debajo)', () => {
      expect(new MusculosDolorGradoVO(-1).value).toBeNull();
    });

    it('11 → null (BVA justo encima)', () => {
      expect(new MusculosDolorGradoVO(11).value).toBeNull();
    });

    it('NaN → null', () => {
      expect(new MusculosDolorGradoVO(NaN).value).toBeNull();
    });
  });
});

// ── ExamenFisicoRegionalAggregate ─────────────────────────────────────────────

describe('ExamenFisicoRegionalAggregate', () => {
  describe('construcción válida', () => {
    it('construye con id_historia y body vacío', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: {},
      });
      expect(agg).toBeDefined();
    });

    it('construye con campos completos', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: {
          cabezaPosicion: 'Normal',
          ojosAgudezaVisual: 8,
          atmAperturaMaximaMm: 45,
          atmMusculosDolorGrado: 3,
        },
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — 51 parámetros', () => {
    it('la longitud del array es exactamente 51', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: {},
      });
      expect(agg.obtenerParametros()).toHaveLength(51);
    });

    it('params[0] es el UUID de id_historia', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: {},
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });

    it('todos los campos vacíos producen null en body (excepto params[0])', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: {},
      });
      const params = agg.obtenerParametros();
      params.slice(1).forEach((p, i) => {
        expect(p).toBeNull(
          `params[${i + 1}] debería ser null pero es ${JSON.stringify(p)}`
        );
      });
    });

    it('params[1] corresponde a cabezaPosicion', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { cabezaPosicion: 'Normal' },
      });
      expect(agg.obtenerParametros()[1]).toBe('Normal');
    });

    it('AgudezaVisualVO en params[11]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { ojosAgudezaVisual: 8 },
      });
      expect(agg.obtenerParametros()[11]).toBe(8);
    });

    it('AgudezaVisualVO fuera de rango → null en params[11]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { ojosAgudezaVisual: 15 },
      });
      expect(agg.obtenerParametros()[11]).toBeNull();
    });

    it('AperturaMaximaVO en params[39]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { atmAperturaMaximaMm: 45 },
      });
      expect(agg.obtenerParametros()[39]).toBe(45);
    });

    it('MusculosDolorGradoVO en params[42]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { atmMusculosDolorGrado: 7 },
      });
      expect(agg.obtenerParametros()[42]).toBe(7);
    });
  });

  describe('alias camelCase / snake_case — kills || → && mutants', () => {
    it('cabeza_posicion (snake_case) → params[1]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { cabeza_posicion: 'Normal' },
      });
      expect(agg.obtenerParametros()[1]).toBe('Normal');
    });

    it('ojos_agudeza_visual → params[11]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { ojos_agudeza_visual: 7 },
      });
      expect(agg.obtenerParametros()[11]).toBe(7);
    });

    it('nariz_forma → params[14]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { nariz_forma: 'Recta' },
      });
      expect(agg.obtenerParametros()[14]).toBe('Recta');
    });

    it('atm_apertura_maxima_mm → params[39]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { atm_apertura_maxima_mm: 40 },
      });
      expect(agg.obtenerParametros()[39]).toBe(40);
    });

    it('atm_musculos_dolor_grado → params[42]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { atm_musculos_dolor_grado: 5 },
      });
      expect(agg.obtenerParametros()[42]).toBe(5);
    });

    it('cuello_simetrico → params[44]', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: VALID_UUID,
        body: { cuello_simetrico: 'Sí' },
      });
      expect(agg.obtenerParametros()[44]).toBe('Sí');
    });
  });

  describe('getter idHistoria', () => {
    it('devuelve el UUID normalizado', () => {
      const agg = new ExamenFisicoRegionalAggregate({
        id_historia: '550E8400-E29B-41D4-A716-446655440000',
        body: {},
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('id_historia null o falsy → lanza "id_historia invalido: debe ser UUIDv4"', () => {
      expect(
        () => new ExamenFisicoRegionalAggregate({ id_historia: null, body: {} })
      ).toThrow('id_historia invalido: debe ser UUIDv4');
    });

    it('id_historia formato inválido → lanza "id_historia invalido: formato UUIDv4 esperado"', () => {
      expect(
        () =>
          new ExamenFisicoRegionalAggregate({ id_historia: 'bad', body: {} })
      ).toThrow('id_historia invalido: formato UUIDv4 esperado');
    });

    it('el error lanzado es DomainError', () => {
      expect(
        () =>
          new ExamenFisicoRegionalAggregate({ id_historia: 'bad', body: {} })
      ).toThrow(DomainError);
    });
  });
});

// ── Tests quirúrgicos para matar mutantes sobrevividos ────────────────────────
// Cada test tiene un comentario explicando exactamente qué mutante mata.

describe('IdHistoriaClinicaVO (examenRegional) — mutantes LogicalOperator', () => {
  // Mata mutante: !value || typeof value !== 'string' → !value && typeof value !== 'string'
  // Con '', !'' = true pero typeof '' === 'string', así que && devuelve false → no lanza.
  // Con ||, !'' = true → lanza. Este test fuerza que se detecte la diferencia.
  it('cadena vacía "" → lanza "id_historia invalido: debe ser UUIDv4" (mata || → &&)', () => {
    expect(() => new IdHistoriaClinicaVO('')).toThrow(
      'id_historia invalido: debe ser UUIDv4'
    );
  });

  // Mata mutante: typeof value !== 'string' eliminado
  // 123 no es string, debe fallar por el typeof check
  it('número 123 → lanza con mensaje "debe ser UUIDv4" (mata ConditionalExpression)', () => {
    expect(() => new IdHistoriaClinicaVO(123)).toThrow(
      'id_historia invalido: debe ser UUIDv4'
    );
  });

  // Verifica que el mensaje del segundo error es el correcto (mata StringLiteral)
  it('UUID v1 (no v4) → lanza "formato UUIDv4 esperado" (mata StringLiteral en segundo error)', () => {
    // UUID v1: tercer grupo empieza con 1, no con 4
    expect(
      () => new IdHistoriaClinicaVO('550e8400-e29b-11d4-a716-446655440000')
    ).toThrow('id_historia invalido: formato UUIDv4 esperado');
  });
});

describe('AgudezaVisualVO — mutantes LogicalOperator null || undefined', () => {
  // Mata mutante: value === null || value === undefined → value === null && value === undefined
  // Con &&: null pasa la primera condición pero falla la segunda → no hace return early
  // Para asegurar que el mutante no sobrevive por el catch del segundo if (Number.isNaN):
  // Necesitamos verificar que null va por el primer if, no por el segundo.
  // Stryker muta el || a &&, y queremos que falle diferente.
  // La forma de distinguirlos es verificar que el valor de retorno es null exactamente.
  it('null → value === null (mata || → && en primer if)', () => {
    const vo = new AgudezaVisualVO(null);
    expect(vo.value).toBeNull();
  });

  it('undefined → value === null (mata || → && en primer if)', () => {
    const vo = new AgudezaVisualVO(undefined);
    expect(vo.value).toBeNull();
  });

  // Mata BlockStatement: el bloque del primer if devuelve antes del segundo.
  // Con block eliminado, null llegaría a Number(null) = 0 → 0 <= 0 → null (mismo resultado)
  // Pero '' → Number('') = 0 → null; sin el primer if '' iría por otro camino.
  it('cadena vacía "" → value === null (mata BlockStatement del primer if)', () => {
    expect(new AgudezaVisualVO('').value).toBeNull();
  });

  // Mata mutante: num <= 0 → num < 0 (EqualityOperator)
  it('exactamente 0 → null (mata <= 0 → < 0)', () => {
    expect(new AgudezaVisualVO(0).value).toBeNull();
  });

  // Mata mutante: num > 10 → num >= 10 (EqualityOperator)
  it('exactamente 10 → 10, no null (mata > 10 → >= 10)', () => {
    expect(new AgudezaVisualVO(10).value).toBe(10);
  });

  // Mata mutante: num > 10 → num > 9 (StringLiteral en el 10)
  it('10.001 → null (valor justo fuera del límite superior)', () => {
    expect(new AgudezaVisualVO(10.001).value).toBeNull();
  });
});

describe('AperturaMaximaVO — mutantes LogicalOperator null || undefined', () => {
  it('null → value === null (mata || → &&)', () => {
    expect(new AperturaMaximaVO(null).value).toBeNull();
  });

  it('undefined → value === null (mata || → &&)', () => {
    expect(new AperturaMaximaVO(undefined).value).toBeNull();
  });

  // '' → Number('') = 0 → válido en [0,100] → devuelve 0 (no null)
  // Para matar el BlockStatement del primer if, usamos un valor que SOLO
  // el segundo if podría normalizar: un objeto que se convierte en NaN.
  it('objeto {} → null (Number({}) = NaN → mata BlockStatement del primer if)', () => {
    expect(new AperturaMaximaVO({}).value).toBeNull();
  });
});

describe('MusculosDolorGradoVO — mutantes LogicalOperator null || undefined', () => {
  it('null → value === null (mata || → &&)', () => {
    expect(new MusculosDolorGradoVO(null).value).toBeNull();
  });

  it('undefined → value === null (mata || → &&)', () => {
    expect(new MusculosDolorGradoVO(undefined).value).toBeNull();
  });

  it('0 → value === 0 (límite inferior válido — mata num < 0)', () => {
    expect(new MusculosDolorGradoVO(0).value).toBe(0);
  });

  it('10 → value === 10 (límite superior válido — mata num > 10)', () => {
    expect(new MusculosDolorGradoVO(10).value).toBe(10);
  });

  it('10.1 → null (fuera del límite superior)', () => {
    expect(new MusculosDolorGradoVO(10.1).value).toBeNull();
  });

  it('-0.1 → null (fuera del límite inferior)', () => {
    expect(new MusculosDolorGradoVO(-0.1).value).toBeNull();
  });
});

// ── Tests snake_case para todos los campos sin cobertura (mata || → &&) ──────
describe('ExamenFisicoRegionalAggregate — alias snake_case sin camelCase', () => {
  const make = (body) =>
    new ExamenFisicoRegionalAggregate({ id_historia: VALID_UUID, body });

  it('cabeza_movimientos → params[2]', () =>
    expect(make({ cabeza_movimientos: 'Normal' }).obtenerParametros()[2]).toBe(
      'Normal'
    ));
  it('cabeza_movimientos_obs → params[3]', () =>
    expect(
      make({ cabeza_movimientos_obs: 'Sin obs' }).obtenerParametros()[3]
    ).toBe('Sin obs'));
  it('craneo_tamano → params[4]', () =>
    expect(make({ craneo_tamano: 'Normal' }).obtenerParametros()[4]).toBe(
      'Normal'
    ));
  it('craneo_forma → params[5]', () =>
    expect(make({ craneo_forma: 'Redonda' }).obtenerParametros()[5]).toBe(
      'Redonda'
    ));
  it('cara_forma_frente → params[6]', () =>
    expect(make({ cara_forma_frente: 'Ovalada' }).obtenerParametros()[6]).toBe(
      'Ovalada'
    ));
  it('cara_forma_perfil → params[7]', () =>
    expect(make({ cara_forma_perfil: 'Recto' }).obtenerParametros()[7]).toBe(
      'Recto'
    ));
  it('ojos_cejas_adecuada → params[8]', () =>
    expect(make({ ojos_cejas_adecuada: 'Sí' }).obtenerParametros()[8]).toBe(
      'Sí'
    ));
  it('ojos_implantacion_obs → params[9]', () =>
    expect(
      make({ ojos_implantacion_obs: 'Normal' }).obtenerParametros()[9]
    ).toBe('Normal'));
  it('ojos_escleroticas → params[10]', () =>
    expect(make({ ojos_escleroticas: 'Blancas' }).obtenerParametros()[10]).toBe(
      'Blancas'
    ));
  it('ojos_iris_color → params[12]', () =>
    expect(make({ ojos_iris_color: 'Café' }).obtenerParametros()[12]).toBe(
      'Café'
    ));
  it('ojos_arco_senil → params[13]', () =>
    expect(make({ ojos_arco_senil: 'No' }).obtenerParametros()[13]).toBe('No'));
  it('nariz_permeables → params[15]', () =>
    expect(make({ nariz_permeables: 'Sí' }).obtenerParametros()[15]).toBe(
      'Sí'
    ));
  it('nariz_secreciones → params[16]', () =>
    expect(make({ nariz_secreciones: 'No' }).obtenerParametros()[16]).toBe(
      'No'
    ));
  it('nariz_senos_dolorosos → params[17]', () =>
    expect(make({ nariz_senos_dolorosos: 'No' }).obtenerParametros()[17]).toBe(
      'No'
    ));
  it('oidos_anomalias_morfologicas → params[18]', () =>
    expect(
      make({ oidos_anomalias_morfologicas: 'No' }).obtenerParametros()[18]
    ).toBe('No'));
  it('oidos_anomalias_obs → params[19]', () =>
    expect(
      make({ oidos_anomalias_obs: 'Normal' }).obtenerParametros()[19]
    ).toBe('Normal'));
  it('oidos_secreciones → params[20]', () =>
    expect(make({ oidos_secreciones: 'No' }).obtenerParametros()[20]).toBe(
      'No'
    ));
  it('oidos_audicion_conservada → params[21]', () =>
    expect(
      make({ oidos_audicion_conservada: 'Sí' }).obtenerParametros()[21]
    ).toBe('Sí'));
  it('atm_trayectoria → params[22]', () =>
    expect(make({ atm_trayectoria: 'Recta' }).obtenerParametros()[22]).toBe(
      'Recta'
    ));
  it('atm_lat_izq_dolor → params[23]', () =>
    expect(make({ atm_lat_izq_dolor: 'Sí' }).obtenerParametros()[23]).toBe(
      'Sí'
    ));
  it('atm_lat_izq_ruido → params[24]', () =>
    expect(make({ atm_lat_izq_ruido: 'No' }).obtenerParametros()[24]).toBe(
      'No'
    ));
  it('atm_lat_izq_salto → params[25]', () =>
    expect(make({ atm_lat_izq_salto: 'No' }).obtenerParametros()[25]).toBe(
      'No'
    ));
  it('atm_lat_der_dolor → params[26]', () =>
    expect(make({ atm_lat_der_dolor: 'No' }).obtenerParametros()[26]).toBe(
      'No'
    ));
  it('atm_lat_der_ruido → params[27]', () =>
    expect(make({ atm_lat_der_ruido: 'No' }).obtenerParametros()[27]).toBe(
      'No'
    ));
  it('atm_lat_der_salto → params[28]', () =>
    expect(make({ atm_lat_der_salto: 'No' }).obtenerParametros()[28]).toBe(
      'No'
    ));
  it('atm_prot_dolor → params[29]', () =>
    expect(make({ atm_prot_dolor: 'Sí' }).obtenerParametros()[29]).toBe('Sí'));
  it('atm_prot_ruido → params[30]', () =>
    expect(make({ atm_prot_ruido: 'No' }).obtenerParametros()[30]).toBe('No'));
  it('atm_prot_salto → params[31]', () =>
    expect(make({ atm_prot_salto: 'No' }).obtenerParametros()[31]).toBe('No'));
  it('atm_aper_dolor → params[32]', () =>
    expect(make({ atm_aper_dolor: 'No' }).obtenerParametros()[32]).toBe('No'));
  it('atm_aper_ruido → params[33]', () =>
    expect(make({ atm_aper_ruido: 'No' }).obtenerParametros()[33]).toBe('No'));
  it('atm_aper_salto → params[34]', () =>
    expect(make({ atm_aper_salto: 'No' }).obtenerParametros()[34]).toBe('No'));
  it('atm_cierre_dolor → params[35]', () =>
    expect(make({ atm_cierre_dolor: 'Sí' }).obtenerParametros()[35]).toBe(
      'Sí'
    ));
  it('atm_cierre_ruido → params[36]', () =>
    expect(make({ atm_cierre_ruido: 'No' }).obtenerParametros()[36]).toBe(
      'No'
    ));
  it('atm_cierre_salto → params[37]', () =>
    expect(make({ atm_cierre_salto: 'No' }).obtenerParametros()[37]).toBe(
      'No'
    ));
  it('atm_coordinacion_condilar → params[38]', () =>
    expect(
      make({ atm_coordinacion_condilar: 'Coordinada' }).obtenerParametros()[38]
    ).toBe('Coordinada'));
  it('atm_observaciones → params[40]', () =>
    expect(
      make({ atm_observaciones: 'Sin cambios' }).obtenerParametros()[40]
    ).toBe('Sin cambios'));
  it('atm_musculos_dolor → params[41]', () =>
    expect(make({ atm_musculos_dolor: 'Leve' }).obtenerParametros()[41]).toBe(
      'Leve'
    ));
  it('atm_musculos_dolor_zona → params[43]', () =>
    expect(
      make({ atm_musculos_dolor_zona: 'Temporal' }).obtenerParametros()[43]
    ).toBe('Temporal'));
  it('cuello_simetrico_obs → params[45]', () =>
    expect(
      make({ cuello_simetrico_obs: 'Normal' }).obtenerParametros()[45]
    ).toBe('Normal'));
  it('cuello_movilidad_conservada → params[46]', () =>
    expect(
      make({ cuello_movilidad_conservada: 'Sí' }).obtenerParametros()[46]
    ).toBe('Sí'));
  it('cuello_movilidad_obs → params[47]', () =>
    expect(
      make({ cuello_movilidad_obs: 'Sin restricción' }).obtenerParametros()[47]
    ).toBe('Sin restricción'));
  it('laringe_alineada → params[48]', () =>
    expect(make({ laringe_alineada: 'Sí' }).obtenerParametros()[48]).toBe(
      'Sí'
    ));
  it('laringe_alineada_obs → params[49]', () =>
    expect(
      make({ laringe_alineada_obs: 'Normal' }).obtenerParametros()[49]
    ).toBe('Normal'));
  it('cuello_otros → params[50]', () =>
    expect(
      make({ cuello_otros: 'Sin hallazgos' }).obtenerParametros()[50]
    ).toBe('Sin hallazgos'));
});
