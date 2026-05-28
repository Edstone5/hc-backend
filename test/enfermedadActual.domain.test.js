import { describe, it, expect } from 'vitest';
import {
  DomainError,
  IdHistoriaClinicaVO,
  TextoClinicoObligatorioVO,
  EnfermedadActualAggregate,
} from '../enfermedadActual/domain/enfermedadActualDomain.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MSG_SINTOMA = 'El sintoma principal es obligatorio';
const MSG_ID = 'La historia clinica debe ser un UUID v4 valido';

// ── DomainError ───────────────────────────────────────────────────────────────

describe('DomainError', () => {
  it('es instancia de Error', () => {
    const err = new DomainError('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('name === "DomainError"', () => {
    expect(new DomainError('x').name).toBe('DomainError');
  });

  it('preserva el mensaje', () => {
    expect(new DomainError('hola').message).toBe('hola');
  });
});

// ── IdHistoriaClinicaVO ───────────────────────────────────────────────────────

describe('IdHistoriaClinicaVO (enfermedadActual)', () => {
  describe('camino feliz', () => {
    it('acepta UUID v4 en minúsculas', () => {
      expect(new IdHistoriaClinicaVO(VALID_UUID).value).toBe(VALID_UUID);
    });

    it('normaliza mayúsculas a minúsculas', () => {
      const upper = '550E8400-E29B-41D4-A716-446655440000';
      expect(new IdHistoriaClinicaVO(upper).value).toBe(VALID_UUID);
    });

    it('elimina espacios al inicio y al final', () => {
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
      expect(() => new IdHistoriaClinicaVO(123)).toThrow(MSG_ID);
    });

    it('cadena vacía → lanza (no pasa regex)', () => {
      expect(() => new IdHistoriaClinicaVO('')).toThrow(MSG_ID);
    });

    it('solo espacios → lanza', () => {
      expect(() => new IdHistoriaClinicaVO('   ')).toThrow(MSG_ID);
    });

    it('UUID v3 → lanza', () => {
      // posición 14 tiene "3" en lugar de "4"
      expect(
        () => new IdHistoriaClinicaVO('550e8400-e29b-31d4-a716-446655440000')
      ).toThrow(MSG_ID);
    });

    it('cadena arbitraria → lanza', () => {
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
    it('el error lanzado es instancia de DomainError', () => {
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

// ── TextoClinicoObligatorioVO ─────────────────────────────────────────────────

describe('TextoClinicoObligatorioVO', () => {
  describe('camino feliz', () => {
    it('acepta texto no vacío', () => {
      const vo = new TextoClinicoObligatorioVO('dolor de muelas', MSG_SINTOMA);
      expect(vo.value).toBe('dolor de muelas');
    });

    it('trimea los espacios del texto', () => {
      const vo = new TextoClinicoObligatorioVO('  fiebre  ', MSG_SINTOMA);
      expect(vo.value).toBe('fiebre');
    });

    it('acepta texto de un solo carácter', () => {
      expect(new TextoClinicoObligatorioVO('a', MSG_SINTOMA).value).toBe('a');
    });

    it('usa el mensaje de error recibido (desacoplamiento)', () => {
      const MSG2 = 'Otro campo obligatorio';
      expect(() => new TextoClinicoObligatorioVO(null, MSG2)).toThrow(MSG2);
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('null → lanza', () => {
      expect(() => new TextoClinicoObligatorioVO(null, MSG_SINTOMA)).toThrow(
        MSG_SINTOMA
      );
    });

    it('undefined → lanza', () => {
      expect(
        () => new TextoClinicoObligatorioVO(undefined, MSG_SINTOMA)
      ).toThrow(MSG_SINTOMA);
    });

    it("cadena vacía '' → lanza", () => {
      expect(() => new TextoClinicoObligatorioVO('', MSG_SINTOMA)).toThrow(
        MSG_SINTOMA
      );
    });

    it('cadena solo espacios → lanza (trimmed === "")', () => {
      expect(() => new TextoClinicoObligatorioVO('   ', MSG_SINTOMA)).toThrow(
        MSG_SINTOMA
      );
    });
  });

  describe('tipo de error', () => {
    it('el error lanzado es instancia de DomainError', () => {
      expect(() => new TextoClinicoObligatorioVO(null, MSG_SINTOMA)).toThrow(
        DomainError
      );
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new TextoClinicoObligatorioVO('dolor', MSG_SINTOMA);
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
    });
  });
});

// ── EnfermedadActualAggregate ─────────────────────────────────────────────────

describe('EnfermedadActualAggregate', () => {
  const FULL_INPUT = {
    id_historia: VALID_UUID,
    sintoma_principal: 'dolor de muelas',
    tiempo_enfermedad: '3 dias',
    forma_inicio: 'subita',
    curso: 'progresivo',
    relato: 'el paciente refiere dolor',
    tratamiento_prev: 'ibuprofeno',
  };

  describe('construcción válida', () => {
    it('construye con todos los campos', () => {
      const agg = new EnfermedadActualAggregate(FULL_INPUT);
      expect(agg.idHistoria).toBe(VALID_UUID);
    });

    it('construye solo con campos obligatorios', () => {
      const agg = new EnfermedadActualAggregate({
        id_historia: VALID_UUID,
        sintoma_principal: 'fiebre',
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — orden y valores exactos', () => {
    it('devuelve 7 parámetros en el orden correcto', () => {
      const agg = new EnfermedadActualAggregate(FULL_INPUT);
      expect(agg.obtenerParametros()).toEqual([
        VALID_UUID, // [0] id_historia
        'dolor de muelas', // [1] sintoma_principal
        '3 dias', // [2] tiempo_enfermedad
        'subita', // [3] forma_inicio
        'progresivo', // [4] curso
        'el paciente refiere dolor', // [5] relato
        'ibuprofeno', // [6] tratamiento_prev
      ]);
    });

    it('opcionales ausentes son null', () => {
      const agg = new EnfermedadActualAggregate({
        id_historia: VALID_UUID,
        sintoma_principal: 'fiebre',
      });
      const p = agg.obtenerParametros();
      expect(p[2]).toBeNull(); // tiempo_enfermedad
      expect(p[3]).toBeNull(); // forma_inicio
      expect(p[4]).toBeNull(); // curso
      expect(p[5]).toBeNull(); // relato
      expect(p[6]).toBeNull(); // tratamiento_prev
    });

    it('string de espacios en opcionales se normaliza a null', () => {
      const agg = new EnfermedadActualAggregate({
        id_historia: VALID_UUID,
        sintoma_principal: 'fiebre',
        tiempo_enfermedad: '   ',
        forma_inicio: '',
      });
      const p = agg.obtenerParametros();
      expect(p[2]).toBeNull();
      expect(p[3]).toBeNull();
    });

    it('sintoma_principal trimado aparece en [1]', () => {
      const agg = new EnfermedadActualAggregate({
        id_historia: VALID_UUID,
        sintoma_principal: '  tos seca  ',
      });
      expect(agg.obtenerParametros()[1]).toBe('tos seca');
    });
  });

  describe('getter idHistoria', () => {
    it('devuelve el UUID normalizado', () => {
      const agg = new EnfermedadActualAggregate({
        id_historia: '550E8400-E29B-41D4-A716-446655440000',
        sintoma_principal: 'dolor',
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('propagación de errores de VOs', () => {
    it('lanza DomainError si id_historia es inválido', () => {
      expect(
        () =>
          new EnfermedadActualAggregate({
            id_historia: 'bad',
            sintoma_principal: 'fiebre',
          })
      ).toThrow(DomainError);
    });

    it('lanza con mensaje exacto si sintoma_principal es vacío', () => {
      expect(
        () =>
          new EnfermedadActualAggregate({
            id_historia: VALID_UUID,
            sintoma_principal: '',
          })
      ).toThrow(MSG_SINTOMA);
    });

    it('lanza con mensaje exacto si sintoma_principal es null', () => {
      expect(
        () =>
          new EnfermedadActualAggregate({
            id_historia: VALID_UUID,
            sintoma_principal: null,
          })
      ).toThrow(MSG_SINTOMA);
    });

    it('lanza con mensaje exacto si sintoma_principal son espacios', () => {
      expect(
        () =>
          new EnfermedadActualAggregate({
            id_historia: VALID_UUID,
            sintoma_principal: '   ',
          })
      ).toThrow(MSG_SINTOMA);
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide mutar el agregado', () => {
      const agg = new EnfermedadActualAggregate({
        id_historia: VALID_UUID,
        sintoma_principal: 'fiebre',
      });
      expect(() => {
        agg.idHistoria = 'otro';
      }).toThrow();
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });
});
