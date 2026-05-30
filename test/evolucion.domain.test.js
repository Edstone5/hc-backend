import { describe, it, expect } from 'vitest';
import {
  DomainError,
  EvolucionAggregate,
} from '../evolucion/domain/evolucionDomain.js';

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

// ── EvolucionAggregate ────────────────────────────────────────────────────────

describe('EvolucionAggregate', () => {
  const FULL_INPUT = {
    idHistory: VALID_UUID,
    fecha: '2024-06-15',
    actividad: 'Extracción dental',
    alumno: 'María García',
    idUsuario: VALID_UUID_2,
  };

  describe('construcción válida', () => {
    it('construye con todos los campos', () => {
      const agg = new EvolucionAggregate(FULL_INPUT);
      expect(agg).toBeDefined();
    });

    it('construye sin fecha (opcional → null)', () => {
      const agg = new EvolucionAggregate({
        idHistory: VALID_UUID,
        idUsuario: VALID_UUID_2,
      });
      expect(agg).toBeDefined();
    });

    it('acepta prefijo HC- en idHistory', () => {
      const agg = new EvolucionAggregate({
        ...FULL_INPUT,
        idHistory: `HC-${VALID_UUID}`,
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve 5 parámetros en el orden correcto', () => {
      const agg = new EvolucionAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()).toEqual([
        VALID_UUID, // [0] idHistory
        '2024-06-15', // [1] fecha (normalizada a YYYY-MM-DD)
        'Extracción dental', // [2] actividad
        'María García', // [3] alumno
        VALID_UUID_2, // [4] idUsuario
      ]);
    });

    it('longitud del array es exactamente 5', () => {
      const agg = new EvolucionAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()).toHaveLength(5);
    });

    it('fecha null produce null en params[1]', () => {
      const agg = new EvolucionAggregate({
        idHistory: VALID_UUID,
        fecha: null,
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()[1]).toBeNull();
    });

    it('actividad vacía produce null en params[2]', () => {
      const agg = new EvolucionAggregate({
        idHistory: VALID_UUID,
        actividad: '',
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()[2]).toBeNull();
    });

    it('alumno null produce null en params[3]', () => {
      const agg = new EvolucionAggregate({
        idHistory: VALID_UUID,
        alumno: null,
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()[3]).toBeNull();
    });

    it('actividad con espacios se trimea y produce valor correcto', () => {
      const agg = new EvolucionAggregate({
        idHistory: VALID_UUID,
        actividad: '  Obturación  ',
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()[2]).toBe('Obturación');
    });
  });

  describe('FechaValueObject — validaciones', () => {
    it('fecha string inválida → lanza "fecha inválida"', () => {
      expect(
        () => new EvolucionAggregate({ ...FULL_INPUT, fecha: 'no-es-fecha' })
      ).toThrow('fecha inválida');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('idHistory inválido → lanza "id_historia es requerido" o "id_historia inválido"', () => {
      expect(
        () => new EvolucionAggregate({ ...FULL_INPUT, idHistory: '' })
      ).toThrow(DomainError);
    });

    it('idHistory null → lanza', () => {
      expect(
        () => new EvolucionAggregate({ ...FULL_INPUT, idHistory: null })
      ).toThrow(DomainError);
    });

    it('idHistory con formato no UUID → lanza "id_historia inválido"', () => {
      expect(
        () => new EvolucionAggregate({ ...FULL_INPUT, idHistory: 'no-uuid' })
      ).toThrow('id_historia inválido');
    });

    it('idUsuario null → lanza "idUsuario es requerido"', () => {
      expect(
        () => new EvolucionAggregate({ ...FULL_INPUT, idUsuario: null })
      ).toThrow('idUsuario es requerido');
    });

    it('idUsuario formato inválido → lanza "idUsuario inválido"', () => {
      expect(
        () => new EvolucionAggregate({ ...FULL_INPUT, idUsuario: 'bad' })
      ).toThrow('idUsuario inválido');
    });
  });
});
