import { describe, it, expect } from 'vitest';
import {
  DomainError,
  UserCodeValueObject,
  EmailValueObject,
  UserAggregate,
} from '../user/domain/userDomain.js';

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

// ── UserCodeValueObject (user) ────────────────────────────────────────────────

describe('UserCodeValueObject (user)', () => {
  describe('camino feliz', () => {
    it('acepta código de usuario válido', () => {
      expect(new UserCodeValueObject('USR001').value).toBe('USR001');
    });

    it('trimea espacios', () => {
      expect(new UserCodeValueObject('  admin  ').value).toBe('admin');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza "userCode es requerido"', () => {
      expect(() => new UserCodeValueObject(null)).toThrow(
        'userCode es requerido'
      );
    });

    it('cadena vacía → lanza', () => {
      expect(() => new UserCodeValueObject('')).toThrow(
        'userCode es requerido'
      );
    });

    it('solo espacios → lanza', () => {
      expect(() => new UserCodeValueObject('   ')).toThrow(
        'userCode es requerido'
      );
    });

    it('número → lanza', () => {
      expect(() => new UserCodeValueObject(0)).toThrow('userCode es requerido');
    });
  });
});

// ── EmailValueObject ──────────────────────────────────────────────────────────

describe('EmailValueObject', () => {
  describe('camino feliz', () => {
    it('acepta email básico válido', () => {
      expect(new EmailValueObject('user@example.com').value).toBe(
        'user@example.com'
      );
    });

    it('acepta email con subdominio', () => {
      expect(new EmailValueObject('user@mail.example.org').value).toBe(
        'user@mail.example.org'
      );
    });

    it('acepta email con puntos en usuario', () => {
      expect(new EmailValueObject('first.last@domain.com').value).toBe(
        'first.last@domain.com'
      );
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza "email inválido"', () => {
      expect(() => new EmailValueObject(null)).toThrow('email inválido');
    });

    it('undefined → lanza', () => {
      expect(() => new EmailValueObject(undefined)).toThrow('email inválido');
    });

    it('número → lanza', () => {
      expect(() => new EmailValueObject(42)).toThrow('email inválido');
    });

    it('email sin @ → lanza', () => {
      expect(() => new EmailValueObject('userexample.com')).toThrow(
        'email inválido'
      );
    });

    it('email sin dominio → lanza', () => {
      expect(() => new EmailValueObject('user@')).toThrow('email inválido');
    });

    it('email sin extensión → lanza', () => {
      expect(() => new EmailValueObject('user@domain')).toThrow(
        'email inválido'
      );
    });

    it('cadena vacía → lanza', () => {
      expect(() => new EmailValueObject('')).toThrow('email inválido');
    });
  });

  describe('tipo de error', () => {
    it('el error lanzado es DomainError', () => {
      expect(() => new EmailValueObject('bad')).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new EmailValueObject('a@b.com');
      expect(() => {
        vo.value = 'x@y.com';
      }).toThrow();
      expect(vo.value).toBe('a@b.com');
    });
  });
});

// ── UserAggregate ─────────────────────────────────────────────────────────────

describe('UserAggregate', () => {
  const validCode = new UserCodeValueObject('USR001');
  const validEmail = new EmailValueObject('user@example.com');

  const FULL_INPUT = {
    userCodeVO: validCode,
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '12345678',
    emailVO: validEmail,
    role: 'estudiante',
    hashedPassword: '$2b$10$abc123',
  };

  describe('construcción válida', () => {
    it('construye con todos los campos', () => {
      const agg = new UserAggregate(FULL_INPUT);
      expect(agg).toBeDefined();
    });

    it('construye con campos opcionales ausentes', () => {
      const agg = new UserAggregate({
        userCodeVO: validCode,
        firstName: 'Ana',
        lastName: 'López',
        emailVO: validEmail,
      });
      expect(agg).toBeDefined();
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve 7 parámetros en el orden correcto', () => {
      const agg = new UserAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()).toEqual([
        'USR001', // [0] userCode
        'Juan', // [1] firstName
        'Pérez', // [2] lastName
        '12345678', // [3] dni
        'user@example.com', // [4] email
        'estudiante', // [5] role
        '$2b$10$abc123', // [6] hashedPassword
      ]);
    });

    it('campos opcionales ausentes producen null en sus posiciones', () => {
      const agg = new UserAggregate({
        userCodeVO: validCode,
        firstName: 'Ana',
        lastName: 'García',
        emailVO: validEmail,
      });
      const p = agg.obtenerParametros();
      expect(p[3]).toBeNull(); // dni
      expect(p[5]).toBeNull(); // role
      expect(p[6]).toBeNull(); // hashedPassword
    });

    it('longitud del array es exactamente 7', () => {
      const agg = new UserAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()).toHaveLength(7);
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si userCodeVO no es instancia de UserCodeValueObject', () => {
      expect(
        () => new UserAggregate({ ...FULL_INPUT, userCodeVO: 'USR001' })
      ).toThrow(DomainError);
    });

    it('lanza DomainError si emailVO no es instancia de EmailValueObject', () => {
      expect(
        () => new UserAggregate({ ...FULL_INPUT, emailVO: 'user@example.com' })
      ).toThrow(DomainError);
    });

    it('lanza DomainError si ambos VOs son null', () => {
      expect(
        () => new UserAggregate({ userCodeVO: null, emailVO: null })
      ).toThrow(DomainError);
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide mutar propiedades', () => {
      const agg = new UserAggregate(FULL_INPUT);
      expect(() => {
        agg._userCode = null;
      }).toThrow();
    });
  });
});
