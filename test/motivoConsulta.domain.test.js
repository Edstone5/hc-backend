import { describe, it, expect } from 'vitest';
import {
  DomainError,
  IdHistoriaClinicaVO,
  MotivoConsultaVO,
  MotivoConsultaAggregate,
} from '../motivoConsulta/domain/motivoConsultaDomain.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MSG_ID = 'id_historia debe ser un UUID valido';
const MSG_TIPO = 'motivo debe ser una cadena de texto';
const MSG_VACIO = 'motivo no puede estar vacio';

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

// ── IdHistoriaClinicaVO ───────────────────────────────────────────────────────

describe('IdHistoriaClinicaVO (motivoConsulta)', () => {
  describe('camino feliz', () => {
    it('acepta UUID v4 en minúsculas', () => {
      expect(new IdHistoriaClinicaVO(VALID_UUID).value).toBe(VALID_UUID);
    });

    it('normaliza mayúsculas', () => {
      expect(
        new IdHistoriaClinicaVO('550E8400-E29B-41D4-A716-446655440000').value
      ).toBe(VALID_UUID);
    });

    it('elimina espacios', () => {
      expect(new IdHistoriaClinicaVO(`  ${VALID_UUID}  `).value).toBe(
        VALID_UUID
      );
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza (no es string)', () => {
      expect(() => new IdHistoriaClinicaVO(null)).toThrow(MSG_ID);
    });

    it('undefined → lanza', () => {
      expect(() => new IdHistoriaClinicaVO(undefined)).toThrow(MSG_ID);
    });

    it('número → lanza', () => {
      expect(() => new IdHistoriaClinicaVO(42)).toThrow(MSG_ID);
    });

    it('cadena vacía → lanza', () => {
      expect(() => new IdHistoriaClinicaVO('')).toThrow(MSG_ID);
    });

    it('cadena sin formato UUID → lanza', () => {
      expect(() => new IdHistoriaClinicaVO('no-es-uuid')).toThrow(MSG_ID);
    });

    it('UUID con carácter extra al inicio → lanza (kills ^ mutant)', () => {
      expect(
        () => new IdHistoriaClinicaVO('x550e8400-e29b-41d4-a716-446655440000')
      ).toThrow(MSG_ID);
    });

    it('UUID con carácter extra al final → lanza (kills $ mutant)', () => {
      expect(
        () => new IdHistoriaClinicaVO('550e8400-e29b-41d4-a716-446655440000x')
      ).toThrow(MSG_ID);
    });
  });

  describe('tipo de error', () => {
    it('el error es instancia de DomainError', () => {
      expect(() => new IdHistoriaClinicaVO('bad')).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new IdHistoriaClinicaVO(VALID_UUID);
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe(VALID_UUID);
    });
  });
});

// ── MotivoConsultaVO ──────────────────────────────────────────────────────────

describe('MotivoConsultaVO', () => {
  describe('camino feliz', () => {
    it('acepta texto y lo trimea', () => {
      expect(new MotivoConsultaVO('  dolor  ').value).toBe('dolor');
    });

    it('acepta texto de un solo carácter', () => {
      expect(new MotivoConsultaVO('a').value).toBe('a');
    });

    it('acepta texto largo', () => {
      const texto = 'revisión periódica de rutina anual';
      expect(new MotivoConsultaVO(texto).value).toBe(texto);
    });
  });

  describe('invariante 1: no es string → MSG_TIPO', () => {
    it('null → lanza MSG_TIPO', () => {
      expect(() => new MotivoConsultaVO(null)).toThrow(MSG_TIPO);
    });

    it('undefined → lanza MSG_TIPO', () => {
      expect(() => new MotivoConsultaVO(undefined)).toThrow(MSG_TIPO);
    });

    it('número 0 → lanza MSG_TIPO', () => {
      expect(() => new MotivoConsultaVO(0)).toThrow(MSG_TIPO);
    });

    it('número 123 → lanza MSG_TIPO', () => {
      expect(() => new MotivoConsultaVO(123)).toThrow(MSG_TIPO);
    });

    it('booleano true → lanza MSG_TIPO', () => {
      expect(() => new MotivoConsultaVO(true)).toThrow(MSG_TIPO);
    });

    it('array → lanza MSG_TIPO', () => {
      expect(() => new MotivoConsultaVO([])).toThrow(MSG_TIPO);
    });

    it('objeto → lanza MSG_TIPO', () => {
      expect(() => new MotivoConsultaVO({})).toThrow(MSG_TIPO);
    });
  });

  describe('invariante 2: string vacío → MSG_VACIO', () => {
    it("cadena vacía '' → lanza MSG_VACIO", () => {
      expect(() => new MotivoConsultaVO('')).toThrow(MSG_VACIO);
    });

    it('cadena solo espacios → lanza MSG_VACIO (trim → 0)', () => {
      expect(() => new MotivoConsultaVO('   ')).toThrow(MSG_VACIO);
    });

    it('cadena solo tabulaciones → lanza MSG_VACIO', () => {
      expect(() => new MotivoConsultaVO('\t\t')).toThrow(MSG_VACIO);
    });
  });

  describe('tipo de error', () => {
    it('el error por tipo no-string es DomainError', () => {
      expect(() => new MotivoConsultaVO(null)).toThrow(DomainError);
    });

    it('el error por vacío es DomainError', () => {
      expect(() => new MotivoConsultaVO('')).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new MotivoConsultaVO('dolor');
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('dolor');
    });
  });
});

// ── MotivoConsultaAggregate ───────────────────────────────────────────────────

describe('MotivoConsultaAggregate', () => {
  describe('construcción válida', () => {
    it('construye con id_historia y motivo', () => {
      const agg = new MotivoConsultaAggregate({
        id_historia: VALID_UUID,
        motivo: 'Caries dental',
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
      expect(agg.motivo).toBe('Caries dental');
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve [id_historia, motivo] en ese orden exacto', () => {
      const agg = new MotivoConsultaAggregate({
        id_historia: VALID_UUID,
        motivo: 'Revisión periódica',
      });
      expect(agg.obtenerParametros()).toEqual([
        VALID_UUID,
        'Revisión periódica',
      ]);
    });

    it('la longitud del array es exactamente 2', () => {
      const agg = new MotivoConsultaAggregate({
        id_historia: VALID_UUID,
        motivo: 'dolor',
      });
      expect(agg.obtenerParametros()).toHaveLength(2);
    });

    it('el motivo se trimea antes de persistirse', () => {
      const agg = new MotivoConsultaAggregate({
        id_historia: VALID_UUID,
        motivo: '  revisión  ',
      });
      expect(agg.obtenerParametros()[1]).toBe('revisión');
    });

    it('[0] es el UUID normalizado en minúsculas', () => {
      const agg = new MotivoConsultaAggregate({
        id_historia: '550E8400-E29B-41D4-A716-446655440000',
        motivo: 'dolor',
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });
  });

  describe('getters', () => {
    it('getter idHistoria devuelve UUID normalizado', () => {
      const agg = new MotivoConsultaAggregate({
        id_historia: VALID_UUID,
        motivo: 'fiebre',
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });

    it('getter motivo devuelve el texto trimado', () => {
      const agg = new MotivoConsultaAggregate({
        id_historia: VALID_UUID,
        motivo: '  revisión de rutina  ',
      });
      expect(agg.motivo).toBe('revisión de rutina');
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si id_historia es inválido', () => {
      expect(
        () =>
          new MotivoConsultaAggregate({ id_historia: 'bad', motivo: 'dolor' })
      ).toThrow(DomainError);
    });

    it('lanza con MSG_ID si id_historia es null', () => {
      expect(
        () =>
          new MotivoConsultaAggregate({ id_historia: null, motivo: 'dolor' })
      ).toThrow(MSG_ID);
    });

    it('lanza MSG_TIPO si motivo no es string', () => {
      expect(
        () =>
          new MotivoConsultaAggregate({ id_historia: VALID_UUID, motivo: null })
      ).toThrow(MSG_TIPO);
    });

    it('lanza MSG_VACIO si motivo es cadena vacía', () => {
      expect(
        () =>
          new MotivoConsultaAggregate({ id_historia: VALID_UUID, motivo: '' })
      ).toThrow(MSG_VACIO);
    });

    it('lanza MSG_VACIO si motivo son solo espacios', () => {
      expect(
        () =>
          new MotivoConsultaAggregate({
            id_historia: VALID_UUID,
            motivo: '   ',
          })
      ).toThrow(MSG_VACIO);
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide mutar propiedades del agregado', () => {
      const agg = new MotivoConsultaAggregate({
        id_historia: VALID_UUID,
        motivo: 'dolor',
      });
      expect(() => {
        agg.idHistoria = 'otro';
      }).toThrow();
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });
});
