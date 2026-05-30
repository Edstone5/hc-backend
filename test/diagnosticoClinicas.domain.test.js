import { describe, it, expect } from 'vitest';
import {
  DomainError,
  DiagnosticoClinicasAggregate,
} from '../diagnosticoClinicas/domain/diagnosticoClinicasDomain.js';

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

// ── DiagnosticoClinicasAggregate ──────────────────────────────────────────────

describe('DiagnosticoClinicasAggregate', () => {
  const FULL_DATA = {
    fechaRespuesta: '2024-06-01',
    clinicaRespuesta: 'Ortodoncia',
    descripcionRespuesta: 'Revisión completa',
    examenes: { rx: true, biopsia: false },
    interconsultaTipo: 'Urgente',
    interconsultaFecha: '2024-06-10',
    interconsultaClinica: 'Cirugía maxilofacial',
    diagnosticoDefinitivo: 'Maloclusión clase II',
    tratamiento: 'Aparatología fija',
    pronostico: 'Favorable',
    alumnoTratante: 'Carlos Quispe',
  };

  const FULL_INPUT = {
    idHistory: VALID_UUID,
    data: FULL_DATA,
    idUsuario: VALID_UUID_2,
  };

  describe('construcción válida', () => {
    it('construye con todos los campos', () => {
      const agg = new DiagnosticoClinicasAggregate(FULL_INPUT);
      expect(agg).toBeDefined();
    });

    it('construye con data vacía (todos null)', () => {
      const agg = new DiagnosticoClinicasAggregate({
        idHistory: VALID_UUID,
        data: {},
        idUsuario: VALID_UUID_2,
      });
      expect(agg).toBeDefined();
    });

    it('construye con examenes como string JSON', () => {
      const agg = new DiagnosticoClinicasAggregate({
        ...FULL_INPUT,
        data: { ...FULL_DATA, examenes: '{"rx": true}' },
      });
      expect(agg).toBeDefined();
    });

    it('acepta prefijo HC- en idHistory', () => {
      const agg = new DiagnosticoClinicasAggregate({
        ...FULL_INPUT,
        idHistory: `HC-${VALID_UUID}`,
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve 13 parámetros', () => {
      const agg = new DiagnosticoClinicasAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()).toHaveLength(13);
    });

    it('params[0] es el idHistory (UUID limpio)', () => {
      const agg = new DiagnosticoClinicasAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });

    it('params[1] es fechaRespuesta normalizada a YYYY-MM-DD', () => {
      const agg = new DiagnosticoClinicasAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()[1]).toBe('2024-06-01');
    });

    it('params[4] es examenes serializado como string JSON', () => {
      const agg = new DiagnosticoClinicasAggregate(FULL_INPUT);
      expect(typeof agg.obtenerParametros()[4]).toBe('string');
      expect(JSON.parse(agg.obtenerParametros()[4])).toEqual({
        rx: true,
        biopsia: false,
      });
    });

    it('params[12] es el idUsuario', () => {
      const agg = new DiagnosticoClinicasAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()[12]).toBe(VALID_UUID_2);
    });

    it('campos de texto vacíos producen null', () => {
      const agg = new DiagnosticoClinicasAggregate({
        idHistory: VALID_UUID,
        data: {
          clinicaRespuesta: '',
          descripcionRespuesta: null,
        },
        idUsuario: VALID_UUID_2,
      });
      const p = agg.obtenerParametros();
      expect(p[2]).toBeNull(); // clinicaRespuesta
      expect(p[3]).toBeNull(); // descripcionRespuesta
    });

    it('fechas nulas producen null', () => {
      const agg = new DiagnosticoClinicasAggregate({
        idHistory: VALID_UUID,
        data: { fechaRespuesta: null, interconsultaFecha: '' },
        idUsuario: VALID_UUID_2,
      });
      const p = agg.obtenerParametros();
      expect(p[1]).toBeNull(); // fechaRespuesta
      expect(p[6]).toBeNull(); // interconsultaFecha
    });
  });

  describe('FechaValueObject — validaciones', () => {
    it('fecha inválida en fechaRespuesta → lanza "fecha inválida"', () => {
      expect(
        () =>
          new DiagnosticoClinicasAggregate({
            ...FULL_INPUT,
            data: { ...FULL_DATA, fechaRespuesta: 'no-fecha' },
          })
      ).toThrow('fecha inválida');
    });
  });

  describe('JSONValueObject — validaciones de examenes', () => {
    it('examenes como string JSON inválido → lanza "JSON inválido"', () => {
      expect(
        () =>
          new DiagnosticoClinicasAggregate({
            ...FULL_INPUT,
            data: { ...FULL_DATA, examenes: '{invalido}' },
          })
      ).toThrow('JSON inválido');
    });

    it('examenes como número → lanza "JSON inválido"', () => {
      expect(
        () =>
          new DiagnosticoClinicasAggregate({
            ...FULL_INPUT,
            data: { ...FULL_DATA, examenes: 42 },
          })
      ).toThrow('JSON inválido');
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('idHistory inválido → lanza', () => {
      expect(
        () =>
          new DiagnosticoClinicasAggregate({ ...FULL_INPUT, idHistory: 'bad' })
      ).toThrow(DomainError);
    });

    it('idHistory null → lanza', () => {
      expect(
        () =>
          new DiagnosticoClinicasAggregate({ ...FULL_INPUT, idHistory: null })
      ).toThrow(DomainError);
    });

    it('idUsuario null → lanza', () => {
      expect(
        () =>
          new DiagnosticoClinicasAggregate({ ...FULL_INPUT, idUsuario: null })
      ).toThrow(DomainError);
    });

    it('idUsuario formato inválido → lanza', () => {
      expect(
        () =>
          new DiagnosticoClinicasAggregate({ ...FULL_INPUT, idUsuario: 'bad' })
      ).toThrow(DomainError);
    });
  });
});
