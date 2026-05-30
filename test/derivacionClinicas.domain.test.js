import { describe, it, expect } from 'vitest';
import {
  DomainError,
  DerivacionClinicasAggregate,
} from '../derivacionClinicas/domain/derivacionClinicasDomain.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660f9500-f39c-41d4-b827-557766551111';

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

// ── DerivacionClinicasAggregate ───────────────────────────────────────────────

describe('DerivacionClinicasAggregate', () => {
  const FULL_INPUT = {
    idHistory: VALID_UUID,
    destinos: { cirugia: true, periodoncia: false },
    observaciones: 'Derivar con urgencia',
    alumno: 'Pedro López',
    docente: 'Dr. Martínez',
    idUsuario: VALID_UUID_2,
  };

  describe('construcción válida', () => {
    it('construye con todos los campos', () => {
      const agg = new DerivacionClinicasAggregate(FULL_INPUT);
      expect(agg).toBeDefined();
    });

    it('construye con destinos como string JSON', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        destinos: '{"cirugia": true}',
      });
      expect(agg).toBeDefined();
    });

    it('construye sin destinos (null → {})', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        destinos: null,
      });
      expect(agg).toBeDefined();
    });

    it('construye con destinos cadena vacía (→ {})', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        destinos: '',
      });
      expect(agg).toBeDefined();
    });

    it('acepta prefijo HC- en idHistory', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        idHistory: `HC-${VALID_UUID}`,
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve 6 parámetros: [idHistory, destinos_json, observaciones, alumno, docente, idUsuario]', () => {
      const agg = new DerivacionClinicasAggregate(FULL_INPUT);
      const params = agg.obtenerParametros();
      expect(params).toHaveLength(6);
      expect(params[0]).toBe(VALID_UUID); // idHistory
      expect(JSON.parse(params[1])).toEqual({
        cirugia: true,
        periodoncia: false,
      }); // destinos JSON
      expect(params[2]).toBe('Derivar con urgencia'); // observaciones
      expect(params[3]).toBe('Pedro López'); // alumno
      expect(params[4]).toBe('Dr. Martínez'); // docente
      expect(params[5]).toBe(VALID_UUID_2); // idUsuario
    });

    it('destinos en params[1] es string JSON', () => {
      const agg = new DerivacionClinicasAggregate(FULL_INPUT);
      expect(typeof agg.obtenerParametros()[1]).toBe('string');
    });

    it('observaciones null produce null en params[2]', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        observaciones: null,
      });
      expect(agg.obtenerParametros()[2]).toBeNull();
    });

    it('observaciones vacía produce null en params[2]', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        observaciones: '',
      });
      expect(agg.obtenerParametros()[2]).toBeNull();
    });

    it('alumno null produce null en params[3]', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        alumno: null,
      });
      expect(agg.obtenerParametros()[3]).toBeNull();
    });

    it('docente nulo produce null en params[4]', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        docente: null,
      });
      expect(agg.obtenerParametros()[4]).toBeNull();
    });
  });

  describe('DestinosValueObject — validaciones de JSON', () => {
    it('objeto plano → se serializa correctamente', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        destinos: { test: 1 },
      });
      expect(JSON.parse(agg.obtenerParametros()[1])).toEqual({ test: 1 });
    });

    it('string JSON válido → se parsea y re-serializa', () => {
      const agg = new DerivacionClinicasAggregate({
        ...FULL_INPUT,
        destinos: '{"test": true}',
      });
      expect(JSON.parse(agg.obtenerParametros()[1])).toEqual({ test: true });
    });

    it('string JSON inválido → lanza "destinos inválidos"', () => {
      expect(
        () =>
          new DerivacionClinicasAggregate({
            ...FULL_INPUT,
            destinos: '{no-es-json}',
          })
      ).toThrow('destinos inválidos');
    });

    it('número como destino → lanza "destinos inválidos"', () => {
      expect(
        () => new DerivacionClinicasAggregate({ ...FULL_INPUT, destinos: 42 })
      ).toThrow('destinos inválidos');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('idHistory inválido → lanza', () => {
      expect(
        () =>
          new DerivacionClinicasAggregate({ ...FULL_INPUT, idHistory: 'bad' })
      ).toThrow(DomainError);
    });

    it('idHistory nulo → lanza', () => {
      expect(
        () =>
          new DerivacionClinicasAggregate({ ...FULL_INPUT, idHistory: null })
      ).toThrow(DomainError);
    });

    it('idUsuario nulo → lanza', () => {
      expect(
        () =>
          new DerivacionClinicasAggregate({ ...FULL_INPUT, idUsuario: null })
      ).toThrow(DomainError);
    });

    it('idUsuario formato inválido → lanza', () => {
      expect(
        () =>
          new DerivacionClinicasAggregate({ ...FULL_INPUT, idUsuario: 'bad' })
      ).toThrow(DomainError);
    });
  });
});

// ── Tests quirúrgicos para matar mutantes sobrevividos ────────────────────────

describe('IdHistoriaValueObject (derivacion) — mensajes exactos (mata StringLiteral)', () => {
  const VALID_USUARIO = '660f9500-f39c-41d4-b827-557766551111';

  // Mata StringLiteral: 'id_historia es requerido' → ''
  // Solo falla si el test verifica el mensaje exacto
  it('idHistory nulo → mensaje "id_historia es requerido"', () => {
    expect(
      () =>
        new DerivacionClinicasAggregate({
          idHistory: null,
          destinos: {},
          observaciones: null,
          alumno: null,
          docente: null,
          idUsuario: VALID_USUARIO,
        })
    ).toThrow('id_historia es requerido');
  });

  // Mata StringLiteral: 'id_historia inválido' → ''
  it('idHistory formato incorrecto → mensaje "id_historia inválido"', () => {
    expect(
      () =>
        new DerivacionClinicasAggregate({
          idHistory: 'no-es-uuid',
          destinos: {},
          observaciones: null,
          alumno: null,
          docente: null,
          idUsuario: VALID_USUARIO,
        })
    ).toThrow('id_historia inválido');
  });

  // Mata StringLiteral: 'idUsuario es requerido' → ''
  it('idUsuario nulo → mensaje "idUsuario es requerido"', () => {
    const VALID_HC = '550e8400-e29b-41d4-a716-446655440000';
    expect(
      () =>
        new DerivacionClinicasAggregate({
          idHistory: VALID_HC,
          destinos: {},
          observaciones: null,
          alumno: null,
          docente: null,
          idUsuario: null,
        })
    ).toThrow('idUsuario es requerido');
  });

  // Mata StringLiteral: 'idUsuario inválido' → ''
  it('idUsuario formato incorrecto → mensaje "idUsuario inválido"', () => {
    const VALID_HC = '550e8400-e29b-41d4-a716-446655440000';
    expect(
      () =>
        new DerivacionClinicasAggregate({
          idHistory: VALID_HC,
          destinos: {},
          observaciones: null,
          alumno: null,
          docente: null,
          idUsuario: 'bad-format',
        })
    ).toThrow('idUsuario inválido');
  });
});

describe('DestinosValueObject — mutantes LogicalOperator (null || undefined || "")', () => {
  const VALID_HC = '550e8400-e29b-41d4-a716-446655440000';
  const VALID_USR = '660f9500-f39c-41d4-b827-557766551111';
  const base = {
    idHistory: VALID_HC,
    observaciones: null,
    alumno: null,
    docente: null,
    idUsuario: VALID_USR,
  };

  // Mata LogicalOperator: null || undefined || '' → null && undefined && ''
  // Con &&: null pasa (null === null = true), pero null === undefined es false → no normaliza
  // Con ||: null === null es true → normaliza a {}
  it('undefined → destinos se normaliza a {} (mata LogicalOperator en DestinosVO)', () => {
    const agg = new DerivacionClinicasAggregate({
      ...base,
      destinos: undefined,
    });
    const destinos = JSON.parse(agg.obtenerParametros()[1]);
    expect(destinos).toEqual({});
  });

  it('null → destinos se normaliza a {}', () => {
    const agg = new DerivacionClinicasAggregate({ ...base, destinos: null });
    expect(JSON.parse(agg.obtenerParametros()[1])).toEqual({});
  });

  it('cadena vacía "" → destinos se normaliza a {}', () => {
    const agg = new DerivacionClinicasAggregate({ ...base, destinos: '' });
    expect(JSON.parse(agg.obtenerParametros()[1])).toEqual({});
  });
});

describe('stripHCPrefix — comportamiento con valores falsy (mata BlockStatement)', () => {
  const VALID_USR = '660f9500-f39c-41d4-b827-557766551111';
  const base = {
    idHistory: undefined,
    destinos: {},
    observaciones: null,
    alumno: null,
    docente: null,
    idUsuario: VALID_USR,
  };

  // stripHCPrefix(id) tiene: if (!id) return id;
  // Mata BlockStatement: si se elimina el bloque, undefined llegaría a .startsWith() → error
  it('idHistory undefined → lanza DomainError (no TypeError)', () => {
    expect(
      () => new DerivacionClinicasAggregate({ ...base, idHistory: undefined })
    ).toThrow(DomainError);
  });

  // stripHCPrefix con HC- prefix
  it('idHistory con prefijo HC- → se normaliza al UUID sin prefijo', () => {
    const VALID_HC = '550e8400-e29b-41d4-a716-446655440000';
    const agg = new DerivacionClinicasAggregate({
      ...base,
      idHistory: `HC-${VALID_HC}`,
      idUsuario: VALID_USR,
    });
    expect(agg.obtenerParametros()[0]).toBe(VALID_HC);
  });
});
