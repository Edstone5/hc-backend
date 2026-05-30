import { describe, it, expect } from 'vitest';
import {
  DomainError,
  IdUuidValueObject,
  ListaHcAdultosAggregate,
} from '../listaHcAdultos/domain/listaHcAdultosDomain.js';

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

// ── IdUuidValueObject ─────────────────────────────────────────────────────────

describe('IdUuidValueObject (listaHcAdultos)', () => {
  describe('camino feliz', () => {
    it('acepta UUID v4 válido', () => {
      expect(new IdUuidValueObject(VALID_UUID).value).toBe(VALID_UUID);
    });

    it('acepta UUID v1 (regex [1-5] — cualquier versión)', () => {
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000';
      expect(new IdUuidValueObject(uuidV1).value).toBe(uuidV1);
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza (no es string)', () => {
      expect(() => new IdUuidValueObject(null)).toThrow(
        'ID de estudiante inválido. Debe ser un UUID v4.'
      );
    });

    it('undefined → lanza', () => {
      expect(() => new IdUuidValueObject(undefined)).toThrow(
        'ID de estudiante inválido. Debe ser un UUID v4.'
      );
    });

    it('número → lanza', () => {
      expect(() => new IdUuidValueObject(42)).toThrow(DomainError);
    });

    it('cadena arbitraria → lanza', () => {
      expect(() => new IdUuidValueObject('no-es-uuid')).toThrow(DomainError);
    });

    it('cadena vacía → lanza', () => {
      expect(() => new IdUuidValueObject('')).toThrow(DomainError);
    });

    it('UUID con carácter extra al inicio → lanza (mata mutante ^)', () => {
      expect(
        () => new IdUuidValueObject('x550e8400-e29b-41d4-a716-446655440000')
      ).toThrow(DomainError);
    });

    it('UUID con carácter extra al final → lanza (mata mutante $)', () => {
      expect(
        () => new IdUuidValueObject('550e8400-e29b-41d4-a716-446655440000x')
      ).toThrow(DomainError);
    });
  });

  describe('tipo de error', () => {
    it('el error lanzado es DomainError', () => {
      expect(() => new IdUuidValueObject('bad')).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new IdUuidValueObject(VALID_UUID);
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe(VALID_UUID);
    });
  });
});

// ── ListaHcAdultosAggregate ───────────────────────────────────────────────────

describe('ListaHcAdultosAggregate', () => {
  const validId = new IdUuidValueObject(VALID_UUID);

  describe('construcción válida', () => {
    it('construye con idEstudianteVO válido', () => {
      const agg = new ListaHcAdultosAggregate({ idEstudianteVO: validId });
      expect(agg).toBeDefined();
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve [uuid] — 1 parámetro', () => {
      const agg = new ListaHcAdultosAggregate({ idEstudianteVO: validId });
      expect(agg.obtenerParametros()).toEqual([VALID_UUID]);
    });

    it('longitud del array es exactamente 1', () => {
      const agg = new ListaHcAdultosAggregate({ idEstudianteVO: validId });
      expect(agg.obtenerParametros()).toHaveLength(1);
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si idEstudianteVO no es instancia de IdUuidValueObject', () => {
      expect(
        () => new ListaHcAdultosAggregate({ idEstudianteVO: VALID_UUID })
      ).toThrow(DomainError);
    });

    it('lanza DomainError si idEstudianteVO es null', () => {
      expect(
        () => new ListaHcAdultosAggregate({ idEstudianteVO: null })
      ).toThrow(DomainError);
    });

    it('lanza DomainError si objeto está vacío', () => {
      expect(() => new ListaHcAdultosAggregate({})).toThrow(DomainError);
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide mutar propiedades', () => {
      const agg = new ListaHcAdultosAggregate({ idEstudianteVO: validId });
      expect(() => {
        agg._idEstudiante = null;
      }).toThrow();
    });
  });
});
