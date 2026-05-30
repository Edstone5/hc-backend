import { describe, it, expect } from 'vitest';
import {
  DomainError,
  IdHistoriaClinicaVO,
  TextoClinicoOpcionalVO,
  ExamenBocaAggregate,
} from '../examenBoca/domain/examenBocaDomain.js';

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

describe('IdHistoriaClinicaVO (examenBoca)', () => {
  describe('camino feliz', () => {
    it('acepta UUID v4 en minúsculas', () => {
      expect(new IdHistoriaClinicaVO(VALID_UUID).value).toBe(VALID_UUID);
    });

    it('normaliza mayúsculas a minúsculas', () => {
      const upper = '550E8400-E29B-41D4-A716-446655440000';
      expect(new IdHistoriaClinicaVO(upper).value).toBe(VALID_UUID);
    });

    it('elimina espacios al inicio y al final', () => {
      expect(new IdHistoriaClinicaVO(`  ${VALID_UUID}  `).value).toBe(
        VALID_UUID
      );
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza "id_historia invalido: debe ser UUIDv4"', () => {
      expect(() => new IdHistoriaClinicaVO(null)).toThrow(
        'id_historia invalido: debe ser UUIDv4'
      );
    });

    it('undefined → lanza', () => {
      expect(() => new IdHistoriaClinicaVO(undefined)).toThrow(DomainError);
    });

    it('número → lanza', () => {
      expect(() => new IdHistoriaClinicaVO(123)).toThrow(DomainError);
    });

    it('cadena no UUID → lanza "id_historia invalido: formato UUIDv4 esperado"', () => {
      expect(() => new IdHistoriaClinicaVO('not-a-uuid')).toThrow(
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

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new IdHistoriaClinicaVO(VALID_UUID);
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe(VALID_UUID);
    });
  });
});

// ── TextoClinicoOpcionalVO ────────────────────────────────────────────────────

describe('TextoClinicoOpcionalVO', () => {
  describe('camino feliz', () => {
    it('acepta texto no vacío', () => {
      expect(new TextoClinicoOpcionalVO('Normal').value).toBe('Normal');
    });

    it('trimea los espacios', () => {
      expect(new TextoClinicoOpcionalVO('  Clase I  ').value).toBe('Clase I');
    });
  });

  describe('normalización silenciosa → null', () => {
    it('null → value = null', () => {
      expect(new TextoClinicoOpcionalVO(null).value).toBeNull();
    });

    it('undefined → value = null', () => {
      expect(new TextoClinicoOpcionalVO(undefined).value).toBeNull();
    });

    it('cadena vacía → value = null', () => {
      expect(new TextoClinicoOpcionalVO('').value).toBeNull();
    });

    it('cadena solo espacios → value = null', () => {
      expect(new TextoClinicoOpcionalVO('   ').value).toBeNull();
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new TextoClinicoOpcionalVO('Normal');
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('Normal');
    });
  });
});

// ── ExamenBocaAggregate ───────────────────────────────────────────────────────

describe('ExamenBocaAggregate', () => {
  describe('construcción válida', () => {
    it('construye con id_historia y body vacío', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: {},
      });
      expect(agg).toBeDefined();
    });

    it('construye con campos completos', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: {
          labiosSin: 'Normal',
          paladarSin: 'Sin lesiones',
          oclusionMolarDer: 'Clase I',
        },
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — 39 parámetros', () => {
    it('la longitud del array es exactamente 39', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: {},
      });
      expect(agg.obtenerParametros()).toHaveLength(39);
    });

    it('params[0] es el UUID del id_historia', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: {},
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });

    it('todos los campos vacíos producen null (excepto params[0])', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: {},
      });
      const params = agg.obtenerParametros();
      // params[0] es el UUID, el resto deben ser null
      params.slice(1).forEach((p, i) => {
        expect(p).toBeNull(`params[${i + 1}] debería ser null pero es ${p}`);
      });
    });

    it('params[1] corresponde a labiosSin', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { labiosSin: 'Normal' },
      });
      expect(agg.obtenerParametros()[1]).toBe('Normal');
    });

    it('params[2] corresponde a labiosCon', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { labiosCon: 'Lesión presente' },
      });
      expect(agg.obtenerParametros()[2]).toBe('Lesión presente');
    });
  });

  describe('alias camelCase / snake_case — kills || → && mutants', () => {
    it('labios_sin_lesiones (snake_case) → se almacena en params[1]', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { labios_sin_lesiones: 'Normal' },
      });
      expect(agg.obtenerParametros()[1]).toBe('Normal');
    });

    it('labios_con_lesiones (snake_case) → se almacena en params[2]', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { labios_con_lesiones: 'Lesión' },
      });
      expect(agg.obtenerParametros()[2]).toBe('Lesión');
    });

    it('vestibulo_sin_lesiones → params[3]', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { vestibulo_sin_lesiones: 'Normal' },
      });
      expect(agg.obtenerParametros()[3]).toBe('Normal');
    });

    it('vestibulo_con_lesiones → params[4]', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { vestibulo_con_lesiones: 'Úlcera' },
      });
      expect(agg.obtenerParametros()[4]).toBe('Úlcera');
    });

    it('paladar_sin_lesiones → params[7]', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { paladar_sin_lesiones: 'Sin alteraciones' },
      });
      expect(agg.obtenerParametros()[7]).toBe('Sin alteraciones');
    });

    it('oclusion_molar_der (snake_case) → mismo índice que oclusionMolarDer (params[17])', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { oclusion_molar_der: 'Clase I' },
      });
      expect(agg.obtenerParametros()[17]).toBe('Clase I');
    });

    it('oclusion_molar_izq → params[18]', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { oclusion_molar_izq: 'Clase II' },
      });
      expect(agg.obtenerParametros()[18]).toBe('Clase II');
    });

    it('oclusion_canina_der → params[19]', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: { oclusion_canina_der: 'Normal' },
      });
      expect(agg.obtenerParametros()[19]).toBe('Normal');
    });
  });

  describe('getter idHistoria', () => {
    it('devuelve el UUID normalizado', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: '550E8400-E29B-41D4-A716-446655440000',
        body: {},
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('id_historia null → lanza "id_historia invalido: debe ser UUIDv4"', () => {
      expect(
        () => new ExamenBocaAggregate({ id_historia: null, body: {} })
      ).toThrow('id_historia invalido: debe ser UUIDv4');
    });

    it('id_historia formato inválido → lanza "id_historia invalido: formato UUIDv4 esperado"', () => {
      expect(
        () => new ExamenBocaAggregate({ id_historia: 'no-es-uuid', body: {} })
      ).toThrow('id_historia invalido: formato UUIDv4 esperado');
    });

    it('el error lanzado es instancia de DomainError', () => {
      expect(
        () => new ExamenBocaAggregate({ id_historia: 'bad', body: {} })
      ).toThrow(DomainError);
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide mutar el agregado', () => {
      const agg = new ExamenBocaAggregate({
        id_historia: VALID_UUID,
        body: {},
      });
      expect(() => {
        agg.idHistoria = 'otro';
      }).toThrow();
    });
  });
});

// ── Tests quirúrgicos — mata mutantes LogicalOperator (|| → &&) ───────────────
// Cada test provee SOLO el alias snake_case, no el camelCase.
// Si el mutante cambia || a &&, el resultado sería undefined (el test falla).

describe('ExamenBocaAggregate — alias snake_case sin camelCase (mata || → &&)', () => {
  // Los campos params[5] y [6]: carrillosSin/carrillosCon
  it('carrillos_retromolar_sin_lesiones → params[5]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { carrillos_retromolar_sin_lesiones: 'Normal' },
    });
    expect(agg.obtenerParametros()[5]).toBe('Normal');
  });

  it('carrillos_retromolar_con_lesiones → params[6]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { carrillos_retromolar_con_lesiones: 'Lesión' },
    });
    expect(agg.obtenerParametros()[6]).toBe('Lesión');
  });

  // params[8]: paladarCon
  it('paladar_con_lesiones → params[8]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { paladar_con_lesiones: 'Inflamado' },
    });
    expect(agg.obtenerParametros()[8]).toBe('Inflamado');
  });

  // params[9]: orofaringeSin, params[10]: orofaringeCon
  it('orofaringe_sin_lesiones → params[9]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { orofaringe_sin_lesiones: 'Normal' },
    });
    expect(agg.obtenerParametros()[9]).toBe('Normal');
  });

  it('orofaringe_con_lesiones → params[10]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { orofaringe_con_lesiones: 'Eritema' },
    });
    expect(agg.obtenerParametros()[10]).toBe('Eritema');
  });

  // params[11], [12]: pisoBocaSin, pisoBocaCon
  it('piso_boca_sin_lesiones → params[11]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { piso_boca_sin_lesiones: 'Sin alteraciones' },
    });
    expect(agg.obtenerParametros()[11]).toBe('Sin alteraciones');
  });

  it('piso_boca_con_lesiones → params[12]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { piso_boca_con_lesiones: 'Tumor' },
    });
    expect(agg.obtenerParametros()[12]).toBe('Tumor');
  });

  // params[13], [14]: lenguaSin, lenguaCon
  it('lengua_sin_lesiones → params[13]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { lengua_sin_lesiones: 'Sin lesiones' },
    });
    expect(agg.obtenerParametros()[13]).toBe('Sin lesiones');
  });

  it('lengua_con_lesiones → params[14]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { lengua_con_lesiones: 'Úlcera' },
    });
    expect(agg.obtenerParametros()[14]).toBe('Úlcera');
  });

  // params[15], [16]: enciaSin, enciaCon
  it('encia_sin_lesiones → params[15]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { encia_sin_lesiones: 'Normal' },
    });
    expect(agg.obtenerParametros()[15]).toBe('Normal');
  });

  it('encia_con_lesiones → params[16]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { encia_con_lesiones: 'Hiperplasia' },
    });
    expect(agg.obtenerParametros()[16]).toBe('Hiperplasia');
  });

  // params[18]: oclusionMolarIzq
  it('oclusion_molar_izq → params[18]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { oclusion_molar_izq: 'Clase III' },
    });
    expect(agg.obtenerParametros()[18]).toBe('Clase III');
  });

  // params[20]: oclusionCaninaIzq
  it('oclusion_canina_izq → params[20]', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { oclusion_canina_izq: 'Normal' },
    });
    expect(agg.obtenerParametros()[20]).toBe('Normal');
  });
});

describe('normalizePrimitive — ConditionalExpression y LogicalOperator', () => {
  // normalizePrimitive es privada, se prueba a través de ExamenBocaAggregate

  // Mata LogicalOperator: undefined || null → undefined && null
  // Si cambia a &&: undefined && null = undefined → labiosSin no se normaliza a null
  it('labiosSin = undefined → params[1] es null (mata || → &&)', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { labiosSin: undefined },
    });
    expect(agg.obtenerParametros()[1]).toBeNull();
  });

  it('labiosSin = null → params[1] es null', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { labiosSin: null },
    });
    expect(agg.obtenerParametros()[1]).toBeNull();
  });

  // Mata ConditionalExpression: typeof value === 'string' → false
  // Si condition → false, string no se trimea → '' quedaría como ''
  it('labiosSin = cadena vacía → params[1] es null (mata t === "" ? null : t)', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { labiosSin: '' },
    });
    expect(agg.obtenerParametros()[1]).toBeNull();
  });

  // Mata ConditionalExpression: typeof value === 'string' → true always
  // Si siempre entra al if, un número quedaría como NaN (String(42).trim() = '42')
  // El test verifica que 42 vuelve como 42 (número), no como '42' (string)
  it('labiosSin = 42 (número) → params[1] es 42, no "42"', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { labiosSin: 42 },
    });
    expect(agg.obtenerParametros()[1]).toBe(42);
  });

  // Mata StringLiteral: '' en la condición t === '' → t !== ''
  it('labiosSin = "  " (solo espacios) → params[1] es null (mata t === "")', () => {
    const agg = new ExamenBocaAggregate({
      id_historia: VALID_UUID,
      body: { labiosSin: '   ' },
    });
    expect(agg.obtenerParametros()[1]).toBeNull();
  });
});
