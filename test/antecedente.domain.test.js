import { describe, it, expect } from 'vitest';
import {
  DomainError,
  IdHistoriaClinicaVO,
  EnteroNoNegativoVO,
  FechaClinicaVO,
  AntecedentePersonalAggregate,
  AntecedenteMedicoAggregate,
  AntecedenteFamiliarAggregate,
  SeguimientoDelTratamientoAggregate,
} from '../antecedente/domain/antecedenteDomain.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MSG_ID = 'El identificador clinico debe ser un UUID valido';

// ── DomainError ───────────────────────────────────────────────────────────────

describe('DomainError', () => {
  it('es instancia de Error', () => {
    expect(new DomainError('x')).toBeInstanceOf(Error);
  });

  it('name === "DomainError"', () => {
    expect(new DomainError('x').name).toBe('DomainError');
  });

  it('preserva el mensaje', () => {
    expect(new DomainError('mensaje test').message).toBe('mensaje test');
  });
});

// ── IdHistoriaClinicaVO ───────────────────────────────────────────────────────

describe('IdHistoriaClinicaVO (antecedente)', () => {
  describe('camino feliz', () => {
    it('acepta UUID v4 en minúsculas', () => {
      expect(new IdHistoriaClinicaVO(VALID_UUID).value).toBe(VALID_UUID);
    });

    it('normaliza mayúsculas a minúsculas', () => {
      expect(
        new IdHistoriaClinicaVO('550E8400-E29B-41D4-A716-446655440000').value
      ).toBe(VALID_UUID);
    });

    it('elimina espacios al inicio/final', () => {
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
      expect(() => new IdHistoriaClinicaVO(99)).toThrow(MSG_ID);
    });

    it("cadena vacía '' → lanza (trim().length === 0)", () => {
      expect(() => new IdHistoriaClinicaVO('')).toThrow(MSG_ID);
    });

    it('cadena solo espacios → lanza (trim().length === 0)', () => {
      expect(() => new IdHistoriaClinicaVO('   ')).toThrow(MSG_ID);
    });

    it('string sin formato UUID → lanza', () => {
      expect(() => new IdHistoriaClinicaVO('no-es-uuid')).toThrow(MSG_ID);
    });

    it('UUID v3 → lanza', () => {
      expect(
        () => new IdHistoriaClinicaVO('550e8400-e29b-31d4-a716-446655440000')
      ).toThrow(MSG_ID);
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

// ── EnteroNoNegativoVO ────────────────────────────────────────────────────────

describe('EnteroNoNegativoVO', () => {
  const MSG = 'La frecuencia de control debe ser un entero no negativo';

  describe('nulos y vacíos → null', () => {
    it('null → value === null', () => {
      expect(new EnteroNoNegativoVO(null, MSG).value).toBeNull();
    });

    it('undefined → value === null', () => {
      expect(new EnteroNoNegativoVO(undefined, MSG).value).toBeNull();
    });

    it("'' → value === null", () => {
      expect(new EnteroNoNegativoVO('', MSG).value).toBeNull();
    });
  });

  describe('valores límite (BVA)', () => {
    it('min-1 = -1 → lanza DomainError', () => {
      expect(() => new EnteroNoNegativoVO(-1, MSG)).toThrow(MSG);
    });

    it('min = 0 → value === 0', () => {
      expect(new EnteroNoNegativoVO(0, MSG).value).toBe(0);
    });

    it('1 (positivo normal) → value === 1', () => {
      expect(new EnteroNoNegativoVO(1, MSG).value).toBe(1);
    });

    it('número grande (1000) → value === 1000', () => {
      expect(new EnteroNoNegativoVO(1000, MSG).value).toBe(1000);
    });

    it('string "3" → convierte a number 3', () => {
      expect(new EnteroNoNegativoVO('3', MSG).value).toBe(3);
    });

    it('string "0" → value === 0', () => {
      expect(new EnteroNoNegativoVO('0', MSG).value).toBe(0);
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('número decimal 2.5 → lanza', () => {
      expect(() => new EnteroNoNegativoVO(2.5, MSG)).toThrow(MSG);
    });

    it('texto no numérico "abc" → lanza', () => {
      expect(() => new EnteroNoNegativoVO('abc', MSG)).toThrow(MSG);
    });

    it('NaN → lanza', () => {
      expect(() => new EnteroNoNegativoVO(NaN, MSG)).toThrow(MSG);
    });

    it('negativo decimal -0.5 → lanza', () => {
      expect(() => new EnteroNoNegativoVO(-0.5, MSG)).toThrow(MSG);
    });
  });

  describe('mensaje de error parametrizado', () => {
    it('usa el mensaje recibido en el constructor', () => {
      const MSG2 = 'La frecuencia de limpieza debe ser un entero no negativo';
      expect(() => new EnteroNoNegativoVO(-1, MSG2)).toThrow(MSG2);
    });
  });

  describe('tipo de error', () => {
    it('el error es instancia de DomainError', () => {
      expect(() => new EnteroNoNegativoVO(-1, MSG)).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new EnteroNoNegativoVO(5, MSG);
      expect(() => {
        vo.value = 99;
      }).toThrow();
      expect(vo.value).toBe(5);
    });
  });
});

// ── FechaClinicaVO ────────────────────────────────────────────────────────────

describe('FechaClinicaVO (antecedente)', () => {
  const MSG_CONS = 'La fecha de consentimiento no tiene un formato valido';

  describe('nulos y vacíos → null', () => {
    it('null → value === null', () => {
      expect(new FechaClinicaVO(null, MSG_CONS).value).toBeNull();
    });

    it('undefined → value === null', () => {
      expect(new FechaClinicaVO(undefined, MSG_CONS).value).toBeNull();
    });

    it("'' → value === null", () => {
      expect(new FechaClinicaVO('', MSG_CONS).value).toBeNull();
    });
  });

  describe('camino feliz', () => {
    it('acepta ISO 8601 y devuelve toISOString()', () => {
      const iso = '2023-06-15T00:00:00.000Z';
      expect(new FechaClinicaVO(iso, MSG_CONS).value).toBe(iso);
    });

    it('acepta fecha en formato YYYY-MM-DD (se convierte a ISO)', () => {
      const vo = new FechaClinicaVO('2023-06-15', MSG_CONS);
      expect(vo.value).toBeTruthy(); // debe ser una ISO string válida
    });
  });

  describe('invariantes — lanza DomainError', () => {
    it('cadena inválida → lanza con el mensaje recibido', () => {
      expect(() => new FechaClinicaVO('not-a-date', MSG_CONS)).toThrow(
        MSG_CONS
      );
    });

    it('usa el mensaje parametrizado correctamente', () => {
      const OTHER = 'Otro mensaje de fecha';
      expect(() => new FechaClinicaVO('xxxxx', OTHER)).toThrow(OTHER);
    });
  });

  describe('tipo de error', () => {
    it('el error es instancia de DomainError', () => {
      expect(() => new FechaClinicaVO('bad', MSG_CONS)).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new FechaClinicaVO('2023-01-01T00:00:00.000Z', MSG_CONS);
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
    });
  });
});

// ── AntecedentePersonalAggregate ──────────────────────────────────────────────

describe('AntecedentePersonalAggregate', () => {
  describe('construcción válida', () => {
    it('construye con solo id_historia (todos los campos opcionales)', () => {
      const agg = new AntecedentePersonalAggregate({ id_historia: VALID_UUID });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });

    it('construye con varios campos opcionales', () => {
      const agg = new AntecedentePersonalAggregate({
        id_historia: VALID_UUID,
        fuma: 'SI',
        cigarrillos_dia: 10,
        seda_dental: true,
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — estructura', () => {
    it('devuelve exactamente 32 parámetros', () => {
      const agg = new AntecedentePersonalAggregate({ id_historia: VALID_UUID });
      expect(agg.obtenerParametros()).toHaveLength(32);
    });

    it('[0] es el UUID normalizado', () => {
      const agg = new AntecedentePersonalAggregate({ id_historia: VALID_UUID });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });

    it('todos los campos opcionales ausentes son null', () => {
      const agg = new AntecedentePersonalAggregate({ id_historia: VALID_UUID });
      const params = agg.obtenerParametros();
      for (let i = 1; i < params.length; i++) {
        expect(params[i]).toBeNull();
      }
    });

    it('[8] = fuma, [9] = cigarrillos_dia en posición exacta', () => {
      const agg = new AntecedentePersonalAggregate({
        id_historia: VALID_UUID,
        fuma: 'SI',
        cigarrillos_dia: '10',
      });
      const p = agg.obtenerParametros();
      expect(p[8]).toBe('SI');
      expect(p[9]).toBe('10');
    });

    it('[31] = otros_elementos_higiene (último parámetro)', () => {
      const agg = new AntecedentePersonalAggregate({
        id_historia: VALID_UUID,
        otros_elementos_higiene: 'pasta fluorada',
      });
      expect(agg.obtenerParametros()[31]).toBe('pasta fluorada');
    });
  });

  describe('normalizePrimitive', () => {
    it('null en campo → null en params', () => {
      const agg = new AntecedentePersonalAggregate({
        id_historia: VALID_UUID,
        esta_embarazada: null,
      });
      expect(agg.obtenerParametros()[1]).toBeNull();
    });

    it('valor truthy se pasa tal cual', () => {
      const agg = new AntecedentePersonalAggregate({
        id_historia: VALID_UUID,
        esta_embarazada: true,
      });
      expect(agg.obtenerParametros()[1]).toBe(true);
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si id_historia es inválido', () => {
      expect(
        () => new AntecedentePersonalAggregate({ id_historia: 'bad' })
      ).toThrow(DomainError);
    });

    it('lanza con MSG_ID correcto', () => {
      expect(
        () => new AntecedentePersonalAggregate({ id_historia: null })
      ).toThrow(MSG_ID);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar el agregado', () => {
      const agg = new AntecedentePersonalAggregate({ id_historia: VALID_UUID });
      expect(() => {
        agg.idHistoria = 'otro';
      }).toThrow();
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });
});

// ── AntecedenteMedicoAggregate ────────────────────────────────────────────────

describe('AntecedenteMedicoAggregate', () => {
  describe('construcción válida', () => {
    it('construye con solo id_historia', () => {
      const agg = new AntecedenteMedicoAggregate({ id_historia: VALID_UUID });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });

    it('construye con campos clínicos', () => {
      const agg = new AntecedenteMedicoAggregate({
        id_historia: VALID_UUID,
        salud_general: 'buena',
        enf_diabetes: 'NO',
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — estructura', () => {
    it('devuelve exactamente 24 parámetros', () => {
      const agg = new AntecedenteMedicoAggregate({ id_historia: VALID_UUID });
      expect(agg.obtenerParametros()).toHaveLength(24);
    });

    it('[0] es el UUID', () => {
      const agg = new AntecedenteMedicoAggregate({ id_historia: VALID_UUID });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });

    it('[1] = salud_general en posición exacta', () => {
      const agg = new AntecedenteMedicoAggregate({
        id_historia: VALID_UUID,
        salud_general: 'regular',
      });
      expect(agg.obtenerParametros()[1]).toBe('regular');
    });

    it('[23] = odontologicos (último parámetro)', () => {
      const agg = new AntecedenteMedicoAggregate({
        id_historia: VALID_UUID,
        odontologicos: 'extracciones múltiples',
      });
      expect(agg.obtenerParametros()[23]).toBe('extracciones múltiples');
    });

    it('todos null cuando no se proporcionan opcionales', () => {
      const agg = new AntecedenteMedicoAggregate({ id_historia: VALID_UUID });
      const p = agg.obtenerParametros();
      for (let i = 1; i < p.length; i++) {
        expect(p[i]).toBeNull();
      }
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si id_historia es inválido', () => {
      expect(
        () => new AntecedenteMedicoAggregate({ id_historia: null })
      ).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar el agregado', () => {
      const agg = new AntecedenteMedicoAggregate({ id_historia: VALID_UUID });
      expect(() => {
        agg.idHistoria = 'otro';
      }).toThrow();
    });
  });
});

// ── AntecedenteFamiliarAggregate ──────────────────────────────────────────────

describe('AntecedenteFamiliarAggregate', () => {
  describe('construcción válida', () => {
    it('construye con id_historia y descripcion', () => {
      const agg = new AntecedenteFamiliarAggregate({
        id_historia: VALID_UUID,
        descripcion: 'Diabetes tipo 2',
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });

    it('construye sin descripcion (null por defecto)', () => {
      const agg = new AntecedenteFamiliarAggregate({ id_historia: VALID_UUID });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — orden exacto', () => {
    it('devuelve [id_historia, descripcion] exactamente', () => {
      const agg = new AntecedenteFamiliarAggregate({
        id_historia: VALID_UUID,
        descripcion: 'Hipertensión',
      });
      expect(agg.obtenerParametros()).toEqual([VALID_UUID, 'Hipertensión']);
    });

    it('longitud es exactamente 2', () => {
      const agg = new AntecedenteFamiliarAggregate({ id_historia: VALID_UUID });
      expect(agg.obtenerParametros()).toHaveLength(2);
    });

    it('descripcion null → null en [1]', () => {
      const agg = new AntecedenteFamiliarAggregate({ id_historia: VALID_UUID });
      expect(agg.obtenerParametros()[1]).toBeNull();
    });

    it('descripcion vacía → null en [1] (normalizePrimitive)', () => {
      const agg = new AntecedenteFamiliarAggregate({
        id_historia: VALID_UUID,
        descripcion: '',
      });
      expect(agg.obtenerParametros()[1]).toBeNull();
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si id_historia es inválido', () => {
      expect(
        () => new AntecedenteFamiliarAggregate({ id_historia: 'bad' })
      ).toThrow(DomainError);
    });
  });
});

// ── SeguimientoDelTratamientoAggregate ────────────────────────────────────────

describe('SeguimientoDelTratamientoAggregate', () => {
  describe('construcción válida', () => {
    it('construye con solo id_historia', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });

    it('construye con frecuencias y fecha válidas', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
        frecuencia_control_meses: 6,
        frecuencia_limpieza_meses: 3,
        fecha_consentimiento: '2023-01-15T00:00:00.000Z',
      });
      const p = agg.obtenerParametros();
      expect(p[3]).toBe(6); // frecuencia_control_meses
      expect(p[5]).toBe(3); // frecuencia_limpieza_meses
      expect(p[10]).toBe('2023-01-15T00:00:00.000Z');
    });
  });

  describe('obtenerParametros() — estructura y orden', () => {
    it('devuelve exactamente 13 parámetros', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
      });
      expect(agg.obtenerParametros()).toHaveLength(13);
    });

    it('[0] es el UUID', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
      });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });

    it('frecuencias null cuando no se proporcionan', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
      });
      const p = agg.obtenerParametros();
      expect(p[3]).toBeNull(); // frecuencia_control_meses
      expect(p[5]).toBeNull(); // frecuencia_limpieza_meses
      expect(p[10]).toBeNull(); // fecha_consentimiento
    });

    it('[1] = motivo_dolor, [2] = motivo_control', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
        motivo_dolor: 'muelas',
        motivo_control: 'revisión',
      });
      const p = agg.obtenerParametros();
      expect(p[1]).toBe('muelas');
      expect(p[2]).toBe('revisión');
    });

    it('[12] = historia_elaborada_por (último parámetro)', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
        historia_elaborada_por: 'Dr. Pérez',
      });
      expect(agg.obtenerParametros()[12]).toBe('Dr. Pérez');
    });
  });

  describe('EnteroNoNegativoVO — invariantes en frecuencias (BVA)', () => {
    it('frecuencia_control_meses = -1 → lanza con mensaje de control', () => {
      expect(
        () =>
          new SeguimientoDelTratamientoAggregate({
            id_historia: VALID_UUID,
            frecuencia_control_meses: -1,
          })
      ).toThrow('La frecuencia de control debe ser un entero no negativo');
    });

    it('frecuencia_control_meses = 0 → válido (límite mínimo)', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
        frecuencia_control_meses: 0,
      });
      expect(agg.obtenerParametros()[3]).toBe(0);
    });

    it('frecuencia_limpieza_meses = -2 → lanza con mensaje de limpieza', () => {
      expect(
        () =>
          new SeguimientoDelTratamientoAggregate({
            id_historia: VALID_UUID,
            frecuencia_limpieza_meses: -2,
          })
      ).toThrow('La frecuencia de limpieza debe ser un entero no negativo');
    });

    it('frecuencia_limpieza_meses = 0 → válido', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
        frecuencia_limpieza_meses: 0,
      });
      expect(agg.obtenerParametros()[5]).toBe(0);
    });

    it('frecuencia_control_meses decimal → lanza', () => {
      expect(
        () =>
          new SeguimientoDelTratamientoAggregate({
            id_historia: VALID_UUID,
            frecuencia_control_meses: 1.5,
          })
      ).toThrow('La frecuencia de control debe ser un entero no negativo');
    });
  });

  describe('FechaClinicaVO — invariante fecha_consentimiento', () => {
    it('fecha inválida → lanza con mensaje de consentimiento', () => {
      expect(
        () =>
          new SeguimientoDelTratamientoAggregate({
            id_historia: VALID_UUID,
            fecha_consentimiento: 'not-a-date',
          })
      ).toThrow('La fecha de consentimiento no tiene un formato valido');
    });

    it('fecha válida ISO → se almacena correctamente', () => {
      const iso = '2024-03-01T00:00:00.000Z';
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
        fecha_consentimiento: iso,
      });
      expect(agg.obtenerParametros()[10]).toBe(iso);
    });
  });

  describe('propagación de errores de id', () => {
    it('lanza DomainError si id_historia es inválido', () => {
      expect(
        () => new SeguimientoDelTratamientoAggregate({ id_historia: 'bad' })
      ).toThrow(DomainError);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar el agregado', () => {
      const agg = new SeguimientoDelTratamientoAggregate({
        id_historia: VALID_UUID,
      });
      expect(() => {
        agg.idHistoria = 'otro';
      }).toThrow();
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });
});
