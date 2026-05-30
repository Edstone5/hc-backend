import { describe, it, expect } from 'vitest';
import {
  DomainError,
  HigieneBocalAggregate,
} from '../higieneBocal/domain/higieneBocalDomain.js';

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

// ── HigieneBocalAggregate ─────────────────────────────────────────────────────

describe('HigieneBocalAggregate', () => {
  describe('construcción válida', () => {
    it('construye con estadoHigiene camelCase', () => {
      const agg = new HigieneBocalAggregate({
        idHistory: VALID_UUID,
        body: { estadoHigiene: 'Buena' },
        idUsuario: VALID_UUID_2,
      });
      expect(agg.estadoHigiene).toBe('Buena');
    });

    it('construye con estado_higiene snake_case', () => {
      const agg = new HigieneBocalAggregate({
        idHistory: VALID_UUID,
        body: { estado_higiene: 'Regular' },
        idUsuario: VALID_UUID_2,
      });
      expect(agg.estadoHigiene).toBe('Regular');
    });

    it('construye con prefijo HC- en idHistory', () => {
      const agg = new HigieneBocalAggregate({
        idHistory: `HC-${VALID_UUID}`,
        body: { estadoHigiene: 'Deficiente' },
        idUsuario: VALID_UUID_2,
      });
      expect(agg.estadoHigiene).toBe('Deficiente');
    });

    it('acepta idUsuario desde body.idUsuario', () => {
      const agg = new HigieneBocalAggregate({
        idHistory: VALID_UUID,
        body: { estadoHigiene: 'Buena', idUsuario: VALID_UUID_2 },
      });
      expect(agg.estadoHigiene).toBe('Buena');
    });

    it('acepta idUsuario desde body.id_usuario (snake_case)', () => {
      const agg = new HigieneBocalAggregate({
        idHistory: VALID_UUID,
        body: { estadoHigiene: 'Buena', id_usuario: VALID_UUID_2 },
      });
      expect(agg.estadoHigiene).toBe('Buena');
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve 3 parámetros: [idHistoria, estadoHigiene, idUsuario]', () => {
      const agg = new HigieneBocalAggregate({
        idHistory: VALID_UUID,
        body: { estadoHigiene: 'Buena' },
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()).toEqual([
        VALID_UUID, // [0] id_historia (sin prefijo HC-)
        'Buena', // [1] estado_higiene
        VALID_UUID_2, // [2] id_usuario
      ]);
    });

    it('longitud del array es exactamente 3', () => {
      const agg = new HigieneBocalAggregate({
        idHistory: VALID_UUID,
        body: { estadoHigiene: 'Regular' },
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()).toHaveLength(3);
    });

    it('prefijo HC- se elimina en params[0]', () => {
      const agg = new HigieneBocalAggregate({
        idHistory: `HC-${VALID_UUID}`,
        body: { estadoHigiene: 'Buena' },
        idUsuario: VALID_UUID_2,
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });
  });

  describe('getter estadoHigiene', () => {
    it('devuelve el valor del estado de higiene', () => {
      const agg = new HigieneBocalAggregate({
        idHistory: VALID_UUID,
        body: { estadoHigiene: 'Buena' },
        idUsuario: VALID_UUID_2,
      });
      expect(agg.estadoHigiene).toBe('Buena');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('idHistory null → lanza (no es string)', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: null,
            body: { estadoHigiene: 'Buena' },
            idUsuario: VALID_UUID_2,
          })
      ).toThrow('id_historia inválido: debe ser una cadena UUIDv4');
    });

    it('idHistory formato inválido → lanza', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: 'no-es-uuid',
            body: { estadoHigiene: 'Buena' },
            idUsuario: VALID_UUID_2,
          })
      ).toThrow('id_historia inválido: formato UUIDv4 esperado');
    });

    it('idHistory UUID con carácter extra al inicio → lanza (mata mutante ^)', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: `x${VALID_UUID}`,
            body: { estadoHigiene: 'Buena' },
            idUsuario: VALID_UUID_2,
          })
      ).toThrow(DomainError);
    });

    it('idHistory UUID con carácter extra al final → lanza (mata mutante $)', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: `${VALID_UUID}x`,
            body: { estadoHigiene: 'Buena' },
            idUsuario: VALID_UUID_2,
          })
      ).toThrow(DomainError);
    });

    it('estadoHigiene null → lanza', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: VALID_UUID,
            body: { estadoHigiene: null },
            idUsuario: VALID_UUID_2,
          })
      ).toThrow('estadoHigiene inválido: no puede estar vacío');
    });

    it('estadoHigiene cadena vacía → lanza', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: VALID_UUID,
            body: { estadoHigiene: '' },
            idUsuario: VALID_UUID_2,
          })
      ).toThrow('estadoHigiene inválido: no puede estar vacío');
    });

    it('estadoHigiene solo espacios → lanza', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: VALID_UUID,
            body: { estadoHigiene: '   ' },
            idUsuario: VALID_UUID_2,
          })
      ).toThrow('estadoHigiene inválido: no puede estar vacío');
    });

    it('idUsuario no es string → lanza', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: VALID_UUID,
            body: { estadoHigiene: 'Buena' },
            idUsuario: 123,
          })
      ).toThrow('idUsuario inválido: debe ser una cadena UUIDv4');
    });

    it('idUsuario con formato inválido → lanza', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: VALID_UUID,
            body: { estadoHigiene: 'Buena' },
            idUsuario: 'no-es-uuid',
          })
      ).toThrow('idUsuario inválido: formato UUIDv4 esperado');
    });

    it('idUsuario UUID con carácter extra al inicio → lanza', () => {
      expect(
        () =>
          new HigieneBocalAggregate({
            idHistory: VALID_UUID,
            body: { estadoHigiene: 'Buena' },
            idUsuario: `x${VALID_UUID_2}`,
          })
      ).toThrow(DomainError);
    });
  });
});
