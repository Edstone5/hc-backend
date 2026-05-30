import { describe, it, expect } from 'vitest';
import {
  DomainError,
  DiagnosticoPresuntivoAggregate,
} from '../diagnosticoPresuntivo/domain/diagnosticoPresuntivoDomain.js';

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

// ── DiagnosticoPresuntivoAggregate ────────────────────────────────────────────

describe('DiagnosticoPresuntivoAggregate', () => {
  const FULL_INPUT = {
    idHistory: VALID_UUID,
    descripcion: 'Caries dental profunda',
    idUsuario: VALID_UUID_2,
  };

  describe('construcción válida', () => {
    it('construye con todos los campos', () => {
      const agg = new DiagnosticoPresuntivoAggregate(FULL_INPUT);
      expect(agg).toBeDefined();
    });

    it('construye sin descripción (campo opcional → null)', () => {
      const agg = new DiagnosticoPresuntivoAggregate({
        idHistory: VALID_UUID,
        descripcion: null,
        idUsuario: VALID_UUID_2,
      });
      expect(agg).toBeDefined();
    });

    it('acepta prefijo HC- en idHistory', () => {
      const agg = new DiagnosticoPresuntivoAggregate({
        ...FULL_INPUT,
        idHistory: `HC-${VALID_UUID}`,
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve 3 parámetros: [idHistory, descripcion, idUsuario]', () => {
      const agg = new DiagnosticoPresuntivoAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()).toEqual([
        VALID_UUID, // [0] idHistory
        'Caries dental profunda', // [1] descripcion
        VALID_UUID_2, // [2] idUsuario
      ]);
    });

    it('longitud del array es exactamente 3', () => {
      const agg = new DiagnosticoPresuntivoAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()).toHaveLength(3);
    });

    it('descripcion null produce null en params[1]', () => {
      const agg = new DiagnosticoPresuntivoAggregate({
        idHistory: VALID_UUID,
        descripcion: null,
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()[1]).toBeNull();
    });

    it('descripcion cadena vacía produce null en params[1]', () => {
      const agg = new DiagnosticoPresuntivoAggregate({
        idHistory: VALID_UUID,
        descripcion: '',
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()[1]).toBeNull();
    });

    it('descripcion con espacios se trimea', () => {
      const agg = new DiagnosticoPresuntivoAggregate({
        idHistory: VALID_UUID,
        descripcion: '  Gingivitis  ',
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()[1]).toBe('Gingivitis');
    });

    it('prefijo HC- se elimina en params[0]', () => {
      const agg = new DiagnosticoPresuntivoAggregate({
        ...FULL_INPUT,
        idHistory: `HC-${VALID_UUID}`,
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('idHistory cadena vacía → lanza "id_historia es requerido"', () => {
      expect(
        () =>
          new DiagnosticoPresuntivoAggregate({ ...FULL_INPUT, idHistory: '' })
      ).toThrow('id_historia es requerido');
    });

    it('idHistory null → lanza', () => {
      expect(
        () =>
          new DiagnosticoPresuntivoAggregate({ ...FULL_INPUT, idHistory: null })
      ).toThrow(DomainError);
    });

    it('idHistory formato no UUID → lanza "id_historia inválido"', () => {
      expect(
        () =>
          new DiagnosticoPresuntivoAggregate({
            ...FULL_INPUT,
            idHistory: 'no-uuid',
          })
      ).toThrow('id_historia inválido');
    });

    it('idHistory UUID con carácter extra al inicio → lanza', () => {
      expect(
        () =>
          new DiagnosticoPresuntivoAggregate({
            ...FULL_INPUT,
            idHistory: `x${VALID_UUID}`,
          })
      ).toThrow(DomainError);
    });

    it('idHistory UUID con carácter extra al final → lanza', () => {
      expect(
        () =>
          new DiagnosticoPresuntivoAggregate({
            ...FULL_INPUT,
            idHistory: `${VALID_UUID}x`,
          })
      ).toThrow(DomainError);
    });

    it('idUsuario null → lanza "idUsuario es requerido"', () => {
      expect(
        () =>
          new DiagnosticoPresuntivoAggregate({ ...FULL_INPUT, idUsuario: null })
      ).toThrow('idUsuario es requerido');
    });

    it('idUsuario cadena vacía → lanza', () => {
      expect(
        () =>
          new DiagnosticoPresuntivoAggregate({ ...FULL_INPUT, idUsuario: '' })
      ).toThrow(DomainError);
    });

    it('idUsuario formato inválido → lanza "idUsuario inválido"', () => {
      expect(
        () =>
          new DiagnosticoPresuntivoAggregate({
            ...FULL_INPUT,
            idUsuario: 'bad-uuid',
          })
      ).toThrow('idUsuario inválido');
    });
  });
});
