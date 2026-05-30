import { describe, it, expect } from 'vitest';
import {
  DomainError,
  NombreValueObject,
  ApellidoValueObject,
  FechaNacimientoValueObject,
  IdUuidValueObject,
  PatientAggregate,
} from '../patient/domain/patientDomain.js';

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

// ── NombreValueObject ─────────────────────────────────────────────────────────

describe('NombreValueObject', () => {
  describe('camino feliz', () => {
    it('acepta nombre válido', () => {
      expect(new NombreValueObject('Juan').value).toBe('Juan');
    });

    it('trimea espacios', () => {
      expect(new NombreValueObject('  María  ').value).toBe('María');
    });

    it('acepta nombre de un carácter', () => {
      expect(new NombreValueObject('A').value).toBe('A');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza "nombre es requerido"', () => {
      expect(() => new NombreValueObject(null)).toThrow('nombre es requerido');
    });

    it('undefined → lanza', () => {
      expect(() => new NombreValueObject(undefined)).toThrow(
        'nombre es requerido'
      );
    });

    it('número → lanza', () => {
      expect(() => new NombreValueObject(1)).toThrow('nombre es requerido');
    });

    it('cadena vacía → lanza', () => {
      expect(() => new NombreValueObject('')).toThrow('nombre es requerido');
    });

    it('solo espacios → lanza (trim → vacía)', () => {
      expect(() => new NombreValueObject('   ')).toThrow('nombre es requerido');
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new NombreValueObject('Juan');
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('Juan');
    });
  });
});

// ── ApellidoValueObject ───────────────────────────────────────────────────────

describe('ApellidoValueObject', () => {
  describe('camino feliz', () => {
    it('acepta apellido válido', () => {
      expect(new ApellidoValueObject('García').value).toBe('García');
    });

    it('trimea espacios', () => {
      expect(new ApellidoValueObject('  López  ').value).toBe('López');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza "apellido es requerido"', () => {
      expect(() => new ApellidoValueObject(null)).toThrow(
        'apellido es requerido'
      );
    });

    it('cadena vacía → lanza', () => {
      expect(() => new ApellidoValueObject('')).toThrow(
        'apellido es requerido'
      );
    });

    it('número → lanza', () => {
      expect(() => new ApellidoValueObject(42)).toThrow(
        'apellido es requerido'
      );
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new ApellidoValueObject('García');
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('García');
    });
  });
});

// ── FechaNacimientoValueObject ────────────────────────────────────────────────

describe('FechaNacimientoValueObject', () => {
  describe('camino feliz', () => {
    it('acepta fecha válida y devuelve formato YYYY-MM-DD', () => {
      expect(new FechaNacimientoValueObject('1990-05-15').value).toBe(
        '1990-05-15'
      );
    });

    it('null → value = null (campo opcional)', () => {
      expect(new FechaNacimientoValueObject(null).value).toBeNull();
    });

    it('undefined → value = null', () => {
      expect(new FechaNacimientoValueObject(undefined).value).toBeNull();
    });

    it('cadena vacía → value = null', () => {
      expect(new FechaNacimientoValueObject('').value).toBeNull();
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('fecha inválida → lanza "fechaNacimiento inválida"', () => {
      expect(() => new FechaNacimientoValueObject('no-es-fecha')).toThrow(
        'fechaNacimiento inválida'
      );
    });

    it('texto aleatorio → lanza', () => {
      expect(() => new FechaNacimientoValueObject('abc')).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value en fecha válida', () => {
      const vo = new FechaNacimientoValueObject('1990-01-01');
      expect(() => {
        vo.value = '2000-01-01';
      }).toThrow();
      expect(vo.value).toBe('1990-01-01');
    });
  });
});

// ── IdUuidValueObject (patient) ───────────────────────────────────────────────

describe('IdUuidValueObject (patient)', () => {
  const VALID_36 = '550e8400-e29b-41d4-a716-446655440000'; // exactamente 36 chars

  describe('camino feliz', () => {
    it('acepta string de exactamente 36 caracteres', () => {
      expect(new IdUuidValueObject(VALID_36).value).toBe(VALID_36);
    });
  });

  describe('invariantes — BVA en longitud', () => {
    it('string de 35 caracteres → lanza "ID de paciente inválido"', () => {
      expect(
        () => new IdUuidValueObject('550e8400-e29b-41d4-a716-44665544000')
      ).toThrow('ID de paciente inválido');
    });

    it('string de 37 caracteres → lanza', () => {
      expect(
        () => new IdUuidValueObject('550e8400-e29b-41d4-a716-4466554400001')
      ).toThrow(DomainError);
    });

    it('null → lanza', () => {
      expect(() => new IdUuidValueObject(null)).toThrow(
        'ID de paciente inválido'
      );
    });

    it('número → lanza', () => {
      expect(
        () => new IdUuidValueObject(123456789012345678901234567890123456)
      ).toThrow(DomainError);
    });
  });
});

// ── PatientAggregate ──────────────────────────────────────────────────────────

describe('PatientAggregate', () => {
  const validNombre = new NombreValueObject('Juan');
  const validApellido = new ApellidoValueObject('Pérez');
  const validFecha = new FechaNacimientoValueObject('1990-05-15');

  const FULL_INPUT = {
    nombreVO: validNombre,
    apellidoVO: validApellido,
    dni: '12345678',
    fechaNacimientoVO: validFecha,
    sexo: 'M',
    telefono: '987654321',
    email: 'juan@example.com',
  };

  describe('construcción válida', () => {
    it('construye con todos los campos', () => {
      const agg = new PatientAggregate(FULL_INPUT);
      expect(agg).toBeDefined();
    });

    it('construye solo con campos obligatorios (nombre + apellido)', () => {
      const agg = new PatientAggregate({
        nombreVO: validNombre,
        apellidoVO: validApellido,
      });
      expect(agg).toBeDefined();
    });
  });

  describe('obtenerParametrosParaCrear() — 7 parámetros', () => {
    it('devuelve 7 parámetros en el orden correcto', () => {
      const agg = new PatientAggregate(FULL_INPUT);
      expect(agg.obtenerParametrosParaCrear()).toEqual([
        'Juan', // [0] nombre
        'Pérez', // [1] apellido
        '12345678', // [2] dni
        '1990-05-15', // [3] fechaNacimiento
        'M', // [4] sexo
        '987654321', // [5] telefono
        'juan@example.com', // [6] email
      ]);
    });

    it('campos opcionales ausentes son null', () => {
      const agg = new PatientAggregate({
        nombreVO: validNombre,
        apellidoVO: validApellido,
      });
      const p = agg.obtenerParametrosParaCrear();
      expect(p[2]).toBeNull(); // dni
      expect(p[3]).toBeNull(); // fechaNacimiento
      expect(p[4]).toBeNull(); // sexo
      expect(p[5]).toBeNull(); // telefono
      expect(p[6]).toBeNull(); // email
    });
  });

  describe('obtenerParametrosParaActualizar() — 4 parámetros', () => {
    it('devuelve 4 parámetros en el orden correcto', () => {
      const agg = new PatientAggregate(FULL_INPUT);
      expect(agg.obtenerParametrosParaActualizar()).toEqual([
        'Juan', // [0] nombre
        'Pérez', // [1] apellido
        '987654321', // [2] telefono
        'juan@example.com', // [3] email
      ]);
    });

    it('campos opcionales ausentes son null en actualizar', () => {
      const agg = new PatientAggregate({
        nombreVO: validNombre,
        apellidoVO: validApellido,
      });
      const p = agg.obtenerParametrosParaActualizar();
      expect(p[2]).toBeNull(); // telefono
      expect(p[3]).toBeNull(); // email
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si nombreVO no es instancia de NombreValueObject', () => {
      expect(
        () => new PatientAggregate({ ...FULL_INPUT, nombreVO: 'Juan' })
      ).toThrow(DomainError);
    });

    it('lanza DomainError si apellidoVO no es instancia de ApellidoValueObject', () => {
      expect(
        () => new PatientAggregate({ ...FULL_INPUT, apellidoVO: 'Pérez' })
      ).toThrow(DomainError);
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide mutar propiedades', () => {
      const agg = new PatientAggregate(FULL_INPUT);
      expect(() => {
        agg._nombre = null;
      }).toThrow();
    });
  });
});
