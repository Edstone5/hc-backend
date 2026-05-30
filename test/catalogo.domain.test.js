import { describe, it, expect } from 'vitest';
import {
  DomainError,
  CatalogNameValueObject,
  IdPositiveValueObject,
  CatalogoAggregate,
} from '../catalogo/domain/catalogoDomain.js';

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

// ── CatalogNameValueObject ────────────────────────────────────────────────────

describe('CatalogNameValueObject', () => {
  describe('camino feliz — nombres permitidos', () => {
    const allowed = [
      'catalogo_estado_civil',
      'catalogo_grado_instruccion',
      'catalogo_ocupacion',
      'catalogo_grupo_sanguineo',
      'catalogo_sexo',
      'catalogo_enfermedad',
      'catalogo_habito',
      'catalogo_examen_auxiliar',
      'catalogo_clinica',
      'catalogo_estado_revision',
      'catalogo_posicion',
      'catalogo_medida_regional',
      'catalogo_atm_trayectoria',
      'catalogo_dolor_grado',
      'catalogo_movimiento_mandibular',
    ];

    it.each(allowed)('acepta "%s"', (name) => {
      expect(new CatalogNameValueObject(name).value).toBe(name);
    });

    it('trimea espacios al inicio y al final', () => {
      expect(new CatalogNameValueObject('  catalogo_sexo  ').value).toBe(
        'catalogo_sexo'
      );
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza "catalog name must be a string"', () => {
      expect(() => new CatalogNameValueObject(null)).toThrow(
        'catalog name must be a string'
      );
    });

    it('undefined → lanza', () => {
      expect(() => new CatalogNameValueObject(undefined)).toThrow(DomainError);
    });

    it('número → lanza "catalog name must be a string"', () => {
      expect(() => new CatalogNameValueObject(42)).toThrow(
        'catalog name must be a string'
      );
    });

    it('nombre no permitido → lanza "catalog name not allowed"', () => {
      expect(() => new CatalogNameValueObject('catalogo_x')).toThrow(
        'catalog name not allowed'
      );
    });

    it('cadena vacía → lanza "catalog name not allowed"', () => {
      expect(() => new CatalogNameValueObject('')).toThrow(
        'catalog name not allowed'
      );
    });

    it('nombre casi correcto con typo → lanza', () => {
      expect(() => new CatalogNameValueObject('catalogo_sexoo')).toThrow(
        DomainError
      );
    });
  });

  describe('tipo de error', () => {
    it('el error lanzado es DomainError', () => {
      expect(() => new CatalogNameValueObject('invalid')).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new CatalogNameValueObject('catalogo_sexo');
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('catalogo_sexo');
    });
  });
});

// ── IdPositiveValueObject ─────────────────────────────────────────────────────

describe('IdPositiveValueObject', () => {
  describe('camino feliz', () => {
    it('acepta entero positivo', () => {
      expect(new IdPositiveValueObject(1).value).toBe(1);
    });

    it('acepta número grande', () => {
      expect(new IdPositiveValueObject(999).value).toBe(999);
    });

    it('convierte string numérico a número', () => {
      expect(new IdPositiveValueObject('5').value).toBe(5);
    });
  });

  describe('invariantes — lanza DomainError — BVA', () => {
    it('0 → lanza "id must be a positive integer"', () => {
      expect(() => new IdPositiveValueObject(0)).toThrow(
        'id must be a positive integer'
      );
    });

    it('-1 → lanza (negativo)', () => {
      expect(() => new IdPositiveValueObject(-1)).toThrow(DomainError);
    });

    it('1.5 → lanza (no entero)', () => {
      expect(() => new IdPositiveValueObject(1.5)).toThrow(DomainError);
    });

    it('NaN → lanza', () => {
      expect(() => new IdPositiveValueObject(NaN)).toThrow(DomainError);
    });

    it('texto no numérico → lanza', () => {
      expect(() => new IdPositiveValueObject('abc')).toThrow(DomainError);
    });

    it('null → lanza', () => {
      expect(() => new IdPositiveValueObject(null)).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new IdPositiveValueObject(1);
      expect(() => {
        vo.value = 999;
      }).toThrow();
      expect(vo.value).toBe(1);
    });
  });
});

// ── CatalogoAggregate ─────────────────────────────────────────────────────────

describe('CatalogoAggregate', () => {
  const validName = new CatalogNameValueObject('catalogo_sexo');

  describe('construcción válida', () => {
    it('construye con catalogNameVO válido', () => {
      const agg = new CatalogoAggregate({ catalogNameVO: validName });
      expect(agg).toBeDefined();
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve [catalogName] — 1 parámetro', () => {
      const agg = new CatalogoAggregate({ catalogNameVO: validName });
      expect(agg.obtenerParametros()).toEqual(['catalogo_sexo']);
    });

    it('longitud del array es exactamente 1', () => {
      const agg = new CatalogoAggregate({ catalogNameVO: validName });
      expect(agg.obtenerParametros()).toHaveLength(1);
    });

    it('devuelve el valor trimado del VO', () => {
      const trimmedVO = new CatalogNameValueObject('  catalogo_habito  ');
      const agg = new CatalogoAggregate({ catalogNameVO: trimmedVO });
      expect(agg.obtenerParametros()[0]).toBe('catalogo_habito');
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si catalogNameVO no es instancia de CatalogNameValueObject', () => {
      expect(
        () => new CatalogoAggregate({ catalogNameVO: 'catalogo_sexo' })
      ).toThrow(DomainError);
    });

    it('lanza DomainError si catalogNameVO es null', () => {
      expect(() => new CatalogoAggregate({ catalogNameVO: null })).toThrow(
        DomainError
      );
    });

    it('lanza DomainError si objeto está vacío', () => {
      expect(() => new CatalogoAggregate({})).toThrow(DomainError);
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide mutar propiedades', () => {
      const agg = new CatalogoAggregate({ catalogNameVO: validName });
      expect(() => {
        agg._catalogName = null;
      }).toThrow();
    });
  });
});
