import { describe, it, expect } from 'vitest';
import {
  DomainError,
  UserCodeValueObject,
  PasswordValueObject,
  AuthAggregate,
} from '../auth/domain/authDomain.js';

// ── DomainError ───────────────────────────────────────────────────────────────

describe('DomainError', () => {
  it('es instancia de Error', () => {
    expect(new DomainError('test')).toBeInstanceOf(Error);
  });

  it('name === "DomainError"', () => {
    expect(new DomainError('x').name).toBe('DomainError');
  });

  it('preserva el mensaje', () => {
    expect(new DomainError('hola').message).toBe('hola');
  });
});

// ── UserCodeValueObject ───────────────────────────────────────────────────────

describe('UserCodeValueObject', () => {
  describe('camino feliz', () => {
    it('acepta código de usuario válido', () => {
      expect(new UserCodeValueObject('USR001').value).toBe('USR001');
    });

    it('trimea espacios al inicio y al final', () => {
      expect(new UserCodeValueObject('  admin  ').value).toBe('admin');
    });

    it('acepta código de un solo carácter', () => {
      expect(new UserCodeValueObject('A').value).toBe('A');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza "userCode es requerido"', () => {
      expect(() => new UserCodeValueObject(null)).toThrow(
        'userCode es requerido'
      );
    });

    it('undefined → lanza', () => {
      expect(() => new UserCodeValueObject(undefined)).toThrow(
        'userCode es requerido'
      );
    });

    it('número → lanza (no es string)', () => {
      expect(() => new UserCodeValueObject(123)).toThrow(
        'userCode es requerido'
      );
    });

    it('cadena vacía → lanza', () => {
      expect(() => new UserCodeValueObject('')).toThrow(
        'userCode es requerido'
      );
    });

    it('cadena solo espacios → lanza (trim → vacía)', () => {
      expect(() => new UserCodeValueObject('   ')).toThrow(
        'userCode es requerido'
      );
    });
  });

  describe('tipo de error', () => {
    it('el error lanzado es DomainError', () => {
      expect(() => new UserCodeValueObject(null)).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new UserCodeValueObject('admin');
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('admin');
    });
  });
});

// ── PasswordValueObject ───────────────────────────────────────────────────────

describe('PasswordValueObject', () => {
  describe('camino feliz', () => {
    it('acepta contraseña válida', () => {
      expect(new PasswordValueObject('secret123').value).toBe('secret123');
    });

    it('acepta contraseña de un carácter', () => {
      expect(new PasswordValueObject('x').value).toBe('x');
    });

    it('preserva espacios internos (no trimea contraseñas)', () => {
      expect(new PasswordValueObject('my pass').value).toBe('my pass');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza "password es requerido"', () => {
      expect(() => new PasswordValueObject(null)).toThrow(
        'password es requerido'
      );
    });

    it('undefined → lanza', () => {
      expect(() => new PasswordValueObject(undefined)).toThrow(
        'password es requerido'
      );
    });

    it('número → lanza (no es string)', () => {
      expect(() => new PasswordValueObject(0)).toThrow('password es requerido');
    });

    it("cadena vacía '' → lanza", () => {
      expect(() => new PasswordValueObject('')).toThrow(
        'password es requerido'
      );
    });
  });

  describe('tipo de error', () => {
    it('el error lanzado es DomainError', () => {
      expect(() => new PasswordValueObject(null)).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new PasswordValueObject('secret');
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('secret');
    });
  });
});

// ── AuthAggregate ─────────────────────────────────────────────────────────────

describe('AuthAggregate', () => {
  const validUserCode = new UserCodeValueObject('USR001');
  const validPassword = new PasswordValueObject('pass123');

  describe('construcción válida', () => {
    it('construye con VOs válidos', () => {
      const agg = new AuthAggregate({
        userCodeVO: validUserCode,
        passwordVO: validPassword,
      });
      expect(agg).toBeDefined();
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve [userCode] — 1 parámetro', () => {
      const agg = new AuthAggregate({
        userCodeVO: validUserCode,
        passwordVO: validPassword,
      });
      expect(agg.obtenerParametros()).toEqual(['USR001']);
    });

    it('la longitud del array es exactamente 1', () => {
      const agg = new AuthAggregate({
        userCodeVO: validUserCode,
        passwordVO: validPassword,
      });
      expect(agg.obtenerParametros()).toHaveLength(1);
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si userCodeVO no es instancia correcta', () => {
      expect(
        () =>
          new AuthAggregate({ userCodeVO: 'USR001', passwordVO: validPassword })
      ).toThrow(DomainError);
    });

    it('lanza DomainError si passwordVO no es instancia correcta', () => {
      expect(
        () =>
          new AuthAggregate({ userCodeVO: validUserCode, passwordVO: 'pass' })
      ).toThrow(DomainError);
    });

    it('lanza si userCodeVO es null', () => {
      expect(
        () => new AuthAggregate({ userCodeVO: null, passwordVO: validPassword })
      ).toThrow(DomainError);
    });

    it('lanza si ambos VOs son undefined', () => {
      expect(() => new AuthAggregate({})).toThrow(DomainError);
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide mutar propiedades del agregado', () => {
      const agg = new AuthAggregate({
        userCodeVO: validUserCode,
        passwordVO: validPassword,
      });
      expect(() => {
        agg._userCode = null;
      }).toThrow();
    });
  });
});
