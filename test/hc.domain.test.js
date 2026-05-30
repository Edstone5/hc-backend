import { describe, it, expect } from 'vitest';
import {
  DomainError,
  HistoriaClinicaIdValueObject,
  UsuarioIdValueObject,
  EstadoRevisionValueObject,
  RevisionHistoriaClinicaAggregate,
  RegistroHistoriaClinicaAggregate,
  AsignacionPacienteAggregate,
  ConsultaPacienteHistoriaClinicaAggregate,
  ConsultaHistoriasEstudianteAggregate,
} from '../hc/domain/hcDomain.js';

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
    expect(new DomainError('hola').message).toBe('hola');
  });
});

// ── HistoriaClinicaIdValueObject ──────────────────────────────────────────────

describe('HistoriaClinicaIdValueObject', () => {
  describe('camino feliz', () => {
    it('acepta UUID v4 válido en minúsculas', () => {
      expect(new HistoriaClinicaIdValueObject(VALID_UUID).value).toBe(
        VALID_UUID
      );
    });

    it('normaliza mayúsculas a minúsculas', () => {
      const upper = '550E8400-E29B-41D4-A716-446655440000';
      expect(new HistoriaClinicaIdValueObject(upper).value).toBe(VALID_UUID);
    });

    it('trimea espacios', () => {
      expect(new HistoriaClinicaIdValueObject(`  ${VALID_UUID}  `).value).toBe(
        VALID_UUID
      );
    });

    it('elimina prefijo HC- y devuelve UUID limpio', () => {
      expect(new HistoriaClinicaIdValueObject(`HC-${VALID_UUID}`).value).toBe(
        VALID_UUID
      );
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza (no es string)', () => {
      expect(() => new HistoriaClinicaIdValueObject(null)).toThrow(DomainError);
    });

    it('undefined → lanza', () => {
      expect(() => new HistoriaClinicaIdValueObject(undefined)).toThrow(
        DomainError
      );
    });

    it('número → lanza', () => {
      expect(() => new HistoriaClinicaIdValueObject(123)).toThrow(DomainError);
    });

    it('cadena vacía → lanza', () => {
      expect(() => new HistoriaClinicaIdValueObject('')).toThrow(DomainError);
    });

    it('cadena no UUID → lanza', () => {
      expect(() => new HistoriaClinicaIdValueObject('no-es-uuid')).toThrow(
        DomainError
      );
    });

    it('UUID con carácter extra al inicio → lanza', () => {
      expect(() => new HistoriaClinicaIdValueObject(`x${VALID_UUID}`)).toThrow(
        DomainError
      );
    });

    it('UUID con carácter extra al final → lanza', () => {
      expect(() => new HistoriaClinicaIdValueObject(`${VALID_UUID}x`)).toThrow(
        DomainError
      );
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new HistoriaClinicaIdValueObject(VALID_UUID);
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe(VALID_UUID);
    });
  });
});

// ── UsuarioIdValueObject ──────────────────────────────────────────────────────

describe('UsuarioIdValueObject', () => {
  describe('camino feliz', () => {
    it('acepta UUID v4 válido', () => {
      expect(new UsuarioIdValueObject(VALID_UUID_2).value).toBe(VALID_UUID_2);
    });

    it('normaliza mayúsculas a minúsculas', () => {
      const upper = '660F9500-F39C-41D4-B827-557766551111';
      expect(new UsuarioIdValueObject(upper).value).toBe(VALID_UUID_2);
    });

    it('acepta prefijo HC- y lo elimina', () => {
      expect(new UsuarioIdValueObject(`HC-${VALID_UUID}`).value).toBe(
        VALID_UUID
      );
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza', () => {
      expect(() => new UsuarioIdValueObject(null)).toThrow(DomainError);
    });

    it('cadena no UUID → lanza', () => {
      expect(() => new UsuarioIdValueObject('no-uuid')).toThrow(DomainError);
    });

    it('cadena vacía → lanza', () => {
      expect(() => new UsuarioIdValueObject('')).toThrow(DomainError);
    });
  });
});

// ── EstadoRevisionValueObject ─────────────────────────────────────────────────

describe('EstadoRevisionValueObject', () => {
  describe('camino feliz', () => {
    it('acepta estado válido', () => {
      expect(new EstadoRevisionValueObject('aprobado').value).toBe('aprobado');
    });

    it('trimea espacios', () => {
      expect(new EstadoRevisionValueObject('  pendiente  ').value).toBe(
        'pendiente'
      );
    });

    it('acepta estado de exactamente 80 caracteres (límite)', () => {
      const estado80 = 'a'.repeat(80);
      expect(new EstadoRevisionValueObject(estado80).value).toBe(estado80);
    });
  });

  describe('invariantes — BVA longitud máxima 80', () => {
    it('estado de 81 caracteres → lanza "El estado de la revisión es demasiado largo"', () => {
      expect(() => new EstadoRevisionValueObject('a'.repeat(81))).toThrow(
        'El estado de la revisión es demasiado largo'
      );
    });

    it('null → lanza "El estado de la revisión es obligatorio"', () => {
      expect(() => new EstadoRevisionValueObject(null)).toThrow(
        'El estado de la revisión es obligatorio'
      );
    });

    it('undefined → lanza obligatorio', () => {
      expect(() => new EstadoRevisionValueObject(undefined)).toThrow(
        'El estado de la revisión es obligatorio'
      );
    });

    it('cadena vacía → lanza obligatorio', () => {
      expect(() => new EstadoRevisionValueObject('')).toThrow(
        'El estado de la revisión es obligatorio'
      );
    });

    it('solo espacios → lanza obligatorio (trim → vacío)', () => {
      expect(() => new EstadoRevisionValueObject('   ')).toThrow(
        'El estado de la revisión es obligatorio'
      );
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new EstadoRevisionValueObject('aprobado');
      expect(() => {
        vo.value = 'rechazado';
      }).toThrow();
    });
  });
});

// ── RevisionHistoriaClinicaAggregate ──────────────────────────────────────────

describe('RevisionHistoriaClinicaAggregate', () => {
  const INPUT = {
    idHistory: VALID_UUID,
    idTeacher: VALID_UUID_2,
    state: 'aprobado',
    observations: 'Todo en orden',
  };

  describe('construcción válida', () => {
    it('construye con todos los campos', () => {
      const agg = new RevisionHistoriaClinicaAggregate(INPUT);
      expect(agg).toBeDefined();
    });

    it('construye sin observaciones (opcional)', () => {
      const agg = new RevisionHistoriaClinicaAggregate({
        idHistory: VALID_UUID,
        idTeacher: VALID_UUID_2,
        state: 'pendiente',
      });
      expect(agg).toBeDefined();
    });
  });

  describe('obtenerParametros() — 4 parámetros', () => {
    it('devuelve [idHistory, idTeacher, state, observations]', () => {
      const agg = new RevisionHistoriaClinicaAggregate(INPUT);
      expect(agg.obtenerParametros()).toEqual([
        VALID_UUID,
        VALID_UUID_2,
        'aprobado',
        'Todo en orden',
      ]);
    });

    it('observations null produce null en params[3]', () => {
      const agg = new RevisionHistoriaClinicaAggregate({
        idHistory: VALID_UUID,
        idTeacher: VALID_UUID_2,
        state: 'pendiente',
        observations: null,
      });
      expect(agg.obtenerParametros()[3]).toBeNull();
    });

    it('observations vacío produce null (normalización silenciosa)', () => {
      const agg = new RevisionHistoriaClinicaAggregate({
        idHistory: VALID_UUID,
        idTeacher: VALID_UUID_2,
        state: 'pendiente',
        observations: '  ',
      });
      expect(agg.obtenerParametros()[3]).toBeNull();
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si idHistory es inválido', () => {
      expect(
        () =>
          new RevisionHistoriaClinicaAggregate({ ...INPUT, idHistory: 'bad' })
      ).toThrow(DomainError);
    });

    it('lanza DomainError si idTeacher es inválido', () => {
      expect(
        () =>
          new RevisionHistoriaClinicaAggregate({ ...INPUT, idTeacher: 'bad' })
      ).toThrow(DomainError);
    });

    it('lanza DomainError si state está vacío', () => {
      expect(
        () => new RevisionHistoriaClinicaAggregate({ ...INPUT, state: '' })
      ).toThrow(DomainError);
    });
  });
});

// ── RegistroHistoriaClinicaAggregate ──────────────────────────────────────────

describe('RegistroHistoriaClinicaAggregate', () => {
  describe('construcción válida', () => {
    it('construye con idStudent válido', () => {
      const agg = new RegistroHistoriaClinicaAggregate({
        idStudent: VALID_UUID,
      });
      expect(agg).toBeDefined();
    });
  });

  describe('obtenerParametros() — 1 parámetro', () => {
    it('devuelve [idStudent]', () => {
      const agg = new RegistroHistoriaClinicaAggregate({
        idStudent: VALID_UUID,
      });
      expect(agg.obtenerParametros()).toEqual([VALID_UUID]);
    });

    it('prefijo HC- se elimina', () => {
      const agg = new RegistroHistoriaClinicaAggregate({
        idStudent: `HC-${VALID_UUID}`,
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });
  });

  describe('propagación de errores', () => {
    it('lanza si idStudent es inválido', () => {
      expect(
        () => new RegistroHistoriaClinicaAggregate({ idStudent: 'bad' })
      ).toThrow(DomainError);
    });
  });
});

// ── AsignacionPacienteAggregate ───────────────────────────────────────────────

describe('AsignacionPacienteAggregate', () => {
  describe('construcción válida', () => {
    it('construye con idHistory y idPatient válidos', () => {
      const agg = new AsignacionPacienteAggregate({
        idHistory: VALID_UUID,
        idPatient: VALID_UUID_2,
      });
      expect(agg).toBeDefined();
    });
  });

  describe('obtenerParametros() — 2 parámetros', () => {
    it('devuelve [idHistory, idPatient]', () => {
      const agg = new AsignacionPacienteAggregate({
        idHistory: VALID_UUID,
        idPatient: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()).toEqual([VALID_UUID, VALID_UUID_2]);
    });
  });

  describe('propagación de errores', () => {
    it('lanza si idHistory es inválido', () => {
      expect(
        () =>
          new AsignacionPacienteAggregate({
            idHistory: 'bad',
            idPatient: VALID_UUID_2,
          })
      ).toThrow(DomainError);
    });

    it('lanza si idPatient es inválido', () => {
      expect(
        () =>
          new AsignacionPacienteAggregate({
            idHistory: VALID_UUID,
            idPatient: 'bad',
          })
      ).toThrow(DomainError);
    });
  });
});

// ── ConsultaPacienteHistoriaClinicaAggregate ──────────────────────────────────

describe('ConsultaPacienteHistoriaClinicaAggregate', () => {
  describe('aliases de id_historia', () => {
    it('acepta idHistory', () => {
      const agg = new ConsultaPacienteHistoriaClinicaAggregate({
        idHistory: VALID_UUID,
      });
      expect(agg.obtenerParametros()).toEqual([VALID_UUID]);
    });

    it('acepta id como alias de idHistory', () => {
      const agg = new ConsultaPacienteHistoriaClinicaAggregate({
        id: VALID_UUID,
      });
      expect(agg.obtenerParametros()).toEqual([VALID_UUID]);
    });

    it('acepta id_historia como alias', () => {
      const agg = new ConsultaPacienteHistoriaClinicaAggregate({
        id_historia: VALID_UUID,
      });
      expect(agg.obtenerParametros()).toEqual([VALID_UUID]);
    });
  });

  describe('propagación de errores', () => {
    it('lanza si id_historia es inválido', () => {
      expect(
        () => new ConsultaPacienteHistoriaClinicaAggregate({ idHistory: 'bad' })
      ).toThrow(DomainError);
    });
  });
});

// ── ConsultaHistoriasEstudianteAggregate ──────────────────────────────────────

describe('ConsultaHistoriasEstudianteAggregate', () => {
  describe('aliases de idStudent', () => {
    it('acepta idStudent', () => {
      const agg = new ConsultaHistoriasEstudianteAggregate({
        idStudent: VALID_UUID,
      });
      expect(agg.obtenerParametros()).toEqual([VALID_UUID]);
    });

    it('acepta id como alias de idStudent', () => {
      const agg = new ConsultaHistoriasEstudianteAggregate({ id: VALID_UUID });
      expect(agg.obtenerParametros()).toEqual([VALID_UUID]);
    });
  });

  describe('propagación de errores', () => {
    it('lanza si idStudent es inválido', () => {
      expect(
        () => new ConsultaHistoriasEstudianteAggregate({ idStudent: 'bad' })
      ).toThrow(DomainError);
    });
  });
});

// ── Tests quirúrgicos — matar mutantes StringLiteral y ConditionalExpression ──

describe('HistoriaClinicaIdValueObject — mensajes exactos (mata StringLiteral)', () => {
  // Mata StringLiteral en _normalizeUuid: 'debe ser una cadena UUIDv4 válida' → ''
  it('null → mensaje contiene "debe ser una cadena UUIDv4 válida"', () => {
    expect(() => new HistoriaClinicaIdValueObject(null)).toThrow(
      'id_historia debe ser una cadena UUIDv4 válida'
    );
  });

  it('número → mismo mensaje (typeof !string)', () => {
    expect(() => new HistoriaClinicaIdValueObject(42)).toThrow(
      'id_historia debe ser una cadena UUIDv4 válida'
    );
  });

  // Mata StringLiteral: 'debe ser un UUIDv4 válido' → ''
  it('cadena no-UUID → mensaje "debe ser un UUIDv4 válido"', () => {
    expect(() => new HistoriaClinicaIdValueObject('no-es-uuid')).toThrow(
      'id_historia debe ser un UUIDv4 válido'
    );
  });

  // Mata ConditionalExpression en _normalizePrimitive: null/undefined → null
  it('cadena vacía → lanza (no es string no vacío ni UUID)', () => {
    expect(() => new HistoriaClinicaIdValueObject('')).toThrow(
      'id_historia debe ser una cadena UUIDv4 válida'
    );
  });

  // Mata ConditionalExpression: HC- prefix handling toUpperCase().startsWith('HC-')
  it('prefijo en minúsculas "hc-" → también se elimina el prefijo', () => {
    // La implementación hace toUpperCase() antes de startsWith, así que hc- funciona
    expect(new HistoriaClinicaIdValueObject(`hc-${VALID_UUID}`).value).toBe(
      VALID_UUID
    );
  });
});

describe('UsuarioIdValueObject — mensajes exactos (mata StringLiteral)', () => {
  it('null → mensaje "id_usuario debe ser una cadena UUIDv4 válida"', () => {
    expect(() => new UsuarioIdValueObject(null)).toThrow(
      'id_usuario debe ser una cadena UUIDv4 válida'
    );
  });

  it('cadena no-UUID → mensaje "id_usuario debe ser un UUIDv4 válido"', () => {
    expect(() => new UsuarioIdValueObject('not-uuid')).toThrow(
      'id_usuario debe ser un UUIDv4 válido'
    );
  });
});

describe('HcAggregateBase._normalizePrimitive — ConditionalExpression mutants', () => {
  // Probamos _normalizePrimitive indirectamente a través de RevisionHistoriaClinicaAggregate
  // observations pasa por _normalizePrimitive directamente
  const BASE = {
    idHistory: VALID_UUID,
    idTeacher: VALID_UUID_2,
    state: 'aprobado',
  };

  // Mata ConditionalExpression: value === null || value === undefined → false
  it('observations null → params[3] es null', () => {
    const agg = new RevisionHistoriaClinicaAggregate({
      ...BASE,
      observations: null,
    });
    expect(agg.obtenerParametros()[3]).toBeNull();
  });

  it('observations undefined → params[3] es null', () => {
    const agg = new RevisionHistoriaClinicaAggregate({
      ...BASE,
      observations: undefined,
    });
    expect(agg.obtenerParametros()[3]).toBeNull();
  });

  // Mata ConditionalExpression: text === '' ? null : text
  it('observations cadena vacía → params[3] es null', () => {
    const agg = new RevisionHistoriaClinicaAggregate({
      ...BASE,
      observations: '',
    });
    expect(agg.obtenerParametros()[3]).toBeNull();
  });

  // Mata ConditionalExpression: typeof value !== 'string' → false
  it('observations número → params[3] es el número (no es string, no se trimea)', () => {
    const agg = new RevisionHistoriaClinicaAggregate({
      ...BASE,
      observations: 42,
    });
    expect(agg.obtenerParametros()[3]).toBe(42);
  });

  it('observations texto con espacios → se trimea', () => {
    const agg = new RevisionHistoriaClinicaAggregate({
      ...BASE,
      observations: '  ok  ',
    });
    expect(agg.obtenerParametros()[3]).toBe('ok');
  });
});

describe('EstadoRevisionValueObject — mensajes exactos (mata StringLiteral)', () => {
  // Mata StringLiteral: 'El estado de la revisión es obligatorio' → ''
  it('null → lanza mensaje "El estado de la revisión es obligatorio"', () => {
    expect(() => new EstadoRevisionValueObject(null)).toThrow(
      'El estado de la revisión es obligatorio'
    );
  });

  it('undefined → mismo mensaje obligatorio', () => {
    expect(() => new EstadoRevisionValueObject(undefined)).toThrow(
      'El estado de la revisión es obligatorio'
    );
  });

  it('cadena vacía → mismo mensaje obligatorio', () => {
    expect(() => new EstadoRevisionValueObject('')).toThrow(
      'El estado de la revisión es obligatorio'
    );
  });

  // Mata StringLiteral: 'El estado de la revisión es demasiado largo' → ''
  it('cadena > 80 chars → lanza "El estado de la revisión es demasiado largo"', () => {
    expect(() => new EstadoRevisionValueObject('x'.repeat(81))).toThrow(
      'El estado de la revisión es demasiado largo'
    );
  });

  // Mata ConditionalExpression: normalized.length > 80 → false
  it('cadena de exactamente 80 chars → válida, no lanza', () => {
    expect(() => new EstadoRevisionValueObject('a'.repeat(80))).not.toThrow();
  });

  // Mata ConditionalExpression: normalized.length > 80 → normalized.length > 79
  it('cadena de exactamente 81 chars → lanza', () => {
    expect(() => new EstadoRevisionValueObject('a'.repeat(81))).toThrow(
      DomainError
    );
  });
});
