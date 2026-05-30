import { describe, it, expect } from 'vitest';
import {
  DomainError,
  RoleValueObject,
  StudentUsersAggregate,
} from '../studentUsers/domain/studentUsersDomain.js';

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

// ── RoleValueObject ───────────────────────────────────────────────────────────

describe('RoleValueObject', () => {
  describe('camino feliz', () => {
    it('acepta "estudiante" en minúsculas', () => {
      expect(new RoleValueObject('estudiante').value).toBe('estudiante');
    });

    it('normaliza "ESTUDIANTE" a minúsculas', () => {
      expect(new RoleValueObject('ESTUDIANTE').value).toBe('estudiante');
    });

    it('normaliza "Estudiante" a minúsculas', () => {
      expect(new RoleValueObject('Estudiante').value).toBe('estudiante');
    });

    it('trimea espacios antes de normalizar', () => {
      expect(new RoleValueObject('  estudiante  ').value).toBe('estudiante');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza "role es requerido"', () => {
      expect(() => new RoleValueObject(null)).toThrow('role es requerido');
    });

    it('undefined → lanza "role es requerido"', () => {
      expect(() => new RoleValueObject(undefined)).toThrow('role es requerido');
    });

    it('número → lanza "role es requerido"', () => {
      expect(() => new RoleValueObject(1)).toThrow('role es requerido');
    });

    it('cadena vacía → lanza "role es requerido"', () => {
      expect(() => new RoleValueObject('')).toThrow('role es requerido');
    });

    it('cadena solo espacios → lanza "role es requerido"', () => {
      expect(() => new RoleValueObject('   ')).toThrow('role es requerido');
    });

    it('"docente" → lanza "role inválido — se espera estudiante"', () => {
      expect(() => new RoleValueObject('docente')).toThrow(
        'role inválido — se espera "estudiante"'
      );
    });

    it('"admin" → lanza role inválido', () => {
      expect(() => new RoleValueObject('admin')).toThrow(DomainError);
    });
  });

  describe('tipo de error', () => {
    it('error por tipo incorrecto es DomainError', () => {
      expect(() => new RoleValueObject(null)).toThrow(DomainError);
    });

    it('error por rol inválido es DomainError', () => {
      expect(() => new RoleValueObject('admin')).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new RoleValueObject('estudiante');
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('estudiante');
    });
  });
});

// ── StudentUsersAggregate ─────────────────────────────────────────────────────

describe('StudentUsersAggregate', () => {
  const validRole = new RoleValueObject('estudiante');

  describe('construcción válida', () => {
    it('construye con roleVO válido', () => {
      const agg = new StudentUsersAggregate({ roleVO: validRole });
      expect(agg).toBeDefined();
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve ["estudiante"] — 1 parámetro', () => {
      const agg = new StudentUsersAggregate({ roleVO: validRole });
      expect(agg.obtenerParametros()).toEqual(['estudiante']);
    });

    it('longitud del array es exactamente 1', () => {
      const agg = new StudentUsersAggregate({ roleVO: validRole });
      expect(agg.obtenerParametros()).toHaveLength(1);
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si roleVO no es instancia de RoleValueObject', () => {
      expect(() => new StudentUsersAggregate({ roleVO: 'estudiante' })).toThrow(
        DomainError
      );
    });

    it('lanza DomainError si roleVO es null', () => {
      expect(() => new StudentUsersAggregate({ roleVO: null })).toThrow(
        DomainError
      );
    });

    it('lanza DomainError si roleVO es undefined (objeto vacío)', () => {
      expect(() => new StudentUsersAggregate({})).toThrow(DomainError);
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide mutar propiedades del agregado', () => {
      const agg = new StudentUsersAggregate({ roleVO: validRole });
      expect(() => {
        agg._role = null;
      }).toThrow();
    });
  });
});
