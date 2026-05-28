import { describe, it, expect } from 'vitest';
import {
  DomainError,
  TemperaturaVO,
  PesoVO,
  PresionArterialVO,
  IdHistoriaClinicaVO,
  ExamenFisicoGeneralAggregate,
} from '../examenGeneral/domain/examenGeneralDomain.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MSG_NULL = 'id_historia invalido: debe ser UUIDv4';
const MSG_FMT = 'id_historia invalido: formato UUIDv4 esperado';

// ── DomainError ───────────────────────────────────────────────────────────────

describe('DomainError', () => {
  it('es instancia de Error', () => {
    expect(new DomainError('x')).toBeInstanceOf(Error);
  });

  it('name === "DomainError"', () => {
    expect(new DomainError('x').name).toBe('DomainError');
  });

  it('preserva el mensaje', () => {
    expect(new DomainError('msg').message).toBe('msg');
  });
});

// ── TemperaturaVO ─────────────────────────────────────────────────────────────

describe('TemperaturaVO', () => {
  describe('normalización silenciosa → null (nunca lanza)', () => {
    it('null → value === null', () => {
      expect(new TemperaturaVO(null).value).toBeNull();
    });

    it('undefined → value === null', () => {
      expect(new TemperaturaVO(undefined).value).toBeNull();
    });

    it('texto no numérico "abc" → null', () => {
      expect(new TemperaturaVO('abc').value).toBeNull();
    });
  });

  describe('valores límite — fuera de rango → null', () => {
    it('min-ε: 29.9 → null', () => {
      expect(new TemperaturaVO(29.9).value).toBeNull();
    });

    it('0 → null', () => {
      expect(new TemperaturaVO(0).value).toBeNull();
    });

    it('negativo (-5) → null', () => {
      expect(new TemperaturaVO(-5).value).toBeNull();
    });

    it('max+ε: 45.1 → null', () => {
      expect(new TemperaturaVO(45.1).value).toBeNull();
    });

    it('muy alto (100) → null', () => {
      expect(new TemperaturaVO(100).value).toBeNull();
    });
  });

  describe('valores límite — dentro del rango → value preservado', () => {
    it('min = 30 → 30', () => {
      expect(new TemperaturaVO(30).value).toBe(30);
    });

    it('max = 45 → 45', () => {
      expect(new TemperaturaVO(45).value).toBe(45);
    });

    it('valor central 37 → 37', () => {
      expect(new TemperaturaVO(37).value).toBe(37);
    });

    it('valor decimal 37.5 → 37.5', () => {
      expect(new TemperaturaVO(37.5).value).toBe(37.5);
    });

    it('string "36.6" → 36.6 (número)', () => {
      expect(new TemperaturaVO('36.6').value).toBe(36.6);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value en rango', () => {
      const vo = new TemperaturaVO(37);
      expect(() => {
        vo.value = 99;
      }).toThrow();
      expect(vo.value).toBe(37);
    });

    it('Object.freeze impide mutar value fuera de rango (null)', () => {
      const vo = new TemperaturaVO(100);
      expect(() => {
        vo.value = 37;
      }).toThrow();
      expect(vo.value).toBeNull();
    });
  });
});

// ── PesoVO ────────────────────────────────────────────────────────────────────

describe('PesoVO', () => {
  describe('normalización silenciosa → null', () => {
    it('null → value === null', () => {
      expect(new PesoVO(null).value).toBeNull();
    });

    it('undefined → value === null', () => {
      expect(new PesoVO(undefined).value).toBeNull();
    });

    it('texto no numérico → null', () => {
      expect(new PesoVO('pesado').value).toBeNull();
    });
  });

  describe('valores límite — fuera de rango → null', () => {
    it('límite inferior exacto: 0 → null (<=0 no permitido)', () => {
      expect(new PesoVO(0).value).toBeNull();
    });

    it('negativo -1 → null', () => {
      expect(new PesoVO(-1).value).toBeNull();
    });

    it('max+1: 501 → null', () => {
      expect(new PesoVO(501).value).toBeNull();
    });

    it('muy grande (1000) → null', () => {
      expect(new PesoVO(1000).value).toBeNull();
    });
  });

  describe('valores límite — en rango → value preservado', () => {
    it('min válido (~0): 0.1 → 0.1', () => {
      expect(new PesoVO(0.1).value).toBe(0.1);
    });

    it('max = 500 → 500', () => {
      expect(new PesoVO(500).value).toBe(500);
    });

    it('valor normal 70 → 70', () => {
      expect(new PesoVO(70).value).toBe(70);
    });

    it('string "70" → 70', () => {
      expect(new PesoVO('70').value).toBe(70);
    });

    it('decimal 65.5 → 65.5', () => {
      expect(new PesoVO(65.5).value).toBe(65.5);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new PesoVO(70);
      expect(() => {
        vo.value = 99;
      }).toThrow();
      expect(vo.value).toBe(70);
    });
  });
});

// ── PresionArterialVO ─────────────────────────────────────────────────────────

describe('PresionArterialVO', () => {
  describe('normalización silenciosa → null', () => {
    it('null → value === null', () => {
      expect(new PresionArterialVO(null).value).toBeNull();
    });

    it('undefined → value === null', () => {
      expect(new PresionArterialVO(undefined).value).toBeNull();
    });

    it('texto libre "alta" → null', () => {
      expect(new PresionArterialVO('alta').value).toBeNull();
    });

    it('solo número "120" (sin slash) → null', () => {
      expect(new PresionArterialVO('120').value).toBeNull();
    });

    it('un dígito "9/80" → null (regex exige 2-3 dígitos)', () => {
      expect(new PresionArterialVO('9/80').value).toBeNull();
    });

    it('cuatro dígitos "1200/80" → null', () => {
      expect(new PresionArterialVO('1200/80').value).toBeNull();
    });

    it('sin dígitos en diastólica "120/" → null', () => {
      expect(new PresionArterialVO('120/').value).toBeNull();
    });
  });

  describe('camino feliz — formatos válidos', () => {
    it('2d/2d "12/80" → "12/80"', () => {
      expect(new PresionArterialVO('12/80').value).toBe('12/80');
    });

    it('3d/2d "120/80" → "120/80"', () => {
      expect(new PresionArterialVO('120/80').value).toBe('120/80');
    });

    it('3d/3d "120/080" → "120/080"', () => {
      expect(new PresionArterialVO('120/080').value).toBe('120/080');
    });

    it('2d/3d "90/120" → "90/120"', () => {
      expect(new PresionArterialVO('90/120').value).toBe('90/120');
    });

    it('trimea espacios antes de validar', () => {
      expect(new PresionArterialVO('  120/80  ').value).toBe('120/80');
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar value', () => {
      const vo = new PresionArterialVO('120/80');
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('120/80');
    });
  });
});

// ── IdHistoriaClinicaVO (examenGeneral) ───────────────────────────────────────

describe('IdHistoriaClinicaVO (examenGeneral)', () => {
  describe('camino feliz', () => {
    it('acepta UUID v4 y lo normaliza en minúsculas', () => {
      expect(
        new IdHistoriaClinicaVO('550E8400-E29B-41D4-A716-446655440000').value
      ).toBe(VALID_UUID);
    });

    it('acepta UUID v4 con espacios', () => {
      expect(new IdHistoriaClinicaVO(`  ${VALID_UUID}  `).value).toBe(
        VALID_UUID
      );
    });
  });

  describe('invariante 1 — falsy/no-string → MSG_NULL', () => {
    it('null → primer mensaje', () => {
      expect(() => new IdHistoriaClinicaVO(null)).toThrow(MSG_NULL);
    });

    it('cadena vacía "" → primer mensaje (falsy)', () => {
      expect(() => new IdHistoriaClinicaVO('')).toThrow(MSG_NULL);
    });

    it('número 0 → primer mensaje (falsy)', () => {
      expect(() => new IdHistoriaClinicaVO(0)).toThrow(MSG_NULL);
    });

    it('número no falsy 42 → primer mensaje (no es string)', () => {
      expect(() => new IdHistoriaClinicaVO(42)).toThrow(MSG_NULL);
    });

    it('undefined → primer mensaje', () => {
      expect(() => new IdHistoriaClinicaVO(undefined)).toThrow(MSG_NULL);
    });
  });

  describe('invariante 2 — string truthy sin formato UUID → MSG_FMT', () => {
    it('string arbitrario → segundo mensaje', () => {
      expect(() => new IdHistoriaClinicaVO('no-es-uuid')).toThrow(MSG_FMT);
    });

    it('UUID v3 → segundo mensaje', () => {
      expect(
        () => new IdHistoriaClinicaVO('550e8400-e29b-31d4-a716-446655440000')
      ).toThrow(MSG_FMT);
    });

    it('UUID con variante incorrecta → segundo mensaje', () => {
      // variante debe ser [89ab] en posición 19
      expect(
        () => new IdHistoriaClinicaVO('550e8400-e29b-41d4-c716-446655440000')
      ).toThrow(MSG_FMT);
    });

    it('UUID con carácter extra al inicio → segundo mensaje (kills ^ mutant)', () => {
      expect(
        () => new IdHistoriaClinicaVO('x550e8400-e29b-41d4-a716-446655440000')
      ).toThrow(MSG_FMT);
    });

    it('UUID con carácter extra al final → segundo mensaje (kills $ mutant)', () => {
      expect(
        () => new IdHistoriaClinicaVO('550e8400-e29b-41d4-a716-446655440000x')
      ).toThrow(MSG_FMT);
    });
  });

  describe('tipo de error', () => {
    it('el error es instancia de DomainError', () => {
      expect(() => new IdHistoriaClinicaVO(null)).toThrow(DomainError);
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

// ── ExamenFisicoGeneralAggregate ──────────────────────────────────────────────

describe('ExamenFisicoGeneralAggregate', () => {
  describe('construcción válida', () => {
    it('construye con id_historia y body vacío (default)', () => {
      const agg = new ExamenFisicoGeneralAggregate({ id_historia: VALID_UUID });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });

    it('construye con body completo', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: {
          posicion: 'sedente',
          temperatura: 37.5,
          presion_arterial: '120/80',
          peso: 70,
          talla: '1.75',
        },
      });
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });

  describe('obtenerParametros() — estructura (26 params)', () => {
    it('devuelve exactamente 26 parámetros', () => {
      const agg = new ExamenFisicoGeneralAggregate({ id_historia: VALID_UUID });
      expect(agg.obtenerParametros()).toHaveLength(26);
    });

    it('[0] es el UUID normalizado', () => {
      const agg = new ExamenFisicoGeneralAggregate({ id_historia: VALID_UUID });
      expect(agg.obtenerParametros()[0]).toBe(VALID_UUID);
    });

    it('todos null cuando body está vacío', () => {
      const agg = new ExamenFisicoGeneralAggregate({ id_historia: VALID_UUID });
      const p = agg.obtenerParametros();
      for (let i = 1; i < p.length; i++) {
        expect(p[i]).toBeNull();
      }
    });
  });

  describe('obtenerParametros() — posiciones de VOs críticos', () => {
    it('[9] temperatura válida (37.5) se almacena', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { temperatura: 37.5 },
      });
      expect(agg.obtenerParametros()[9]).toBe(37.5);
    });

    it('[9] temperatura fuera de rango (100) → null', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { temperatura: 100 },
      });
      expect(agg.obtenerParametros()[9]).toBeNull();
    });

    it('[9] temperatura = 30 (límite min) → 30', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { temperatura: 30 },
      });
      expect(agg.obtenerParametros()[9]).toBe(30);
    });

    it('[10] presion_arterial válida ("120/80") se almacena', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { presion_arterial: '120/80' },
      });
      expect(agg.obtenerParametros()[10]).toBe('120/80');
    });

    it('[10] presionArterial alias camelCase funciona', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { presionArterial: '110/70' },
      });
      expect(agg.obtenerParametros()[10]).toBe('110/70');
    });

    it('[10] presión inválida → null', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { presion_arterial: 'mal-formato' },
      });
      expect(agg.obtenerParametros()[10]).toBeNull();
    });

    it('[13] peso válido (65) se almacena', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { peso: 65 },
      });
      expect(agg.obtenerParametros()[13]).toBe(65);
    });

    it('[13] peso = 0 → null (<=0 inválido)', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { peso: 0 },
      });
      expect(agg.obtenerParametros()[13]).toBeNull();
    });

    it('[13] peso = 500 (límite max) → 500', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { peso: 500 },
      });
      expect(agg.obtenerParametros()[13]).toBe(500);
    });
  });

  describe('obtenerParametros() — campos normales', () => {
    it('[1] posicion y [2] actitud en posición correcta', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { posicion: 'sedente', actitud: 'activa' },
      });
      const p = agg.obtenerParametros();
      expect(p[1]).toBe('sedente');
      expect(p[2]).toBe('activa');
    });

    it('[25] gangliosObs (último parámetro)', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { ganglios_obs: 'sin alteraciones' },
      });
      expect(agg.obtenerParametros()[25]).toBe('sin alteraciones');
    });

    it('string vacío en body → null (normalizePrimitive)', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { posicion: '' },
      });
      expect(agg.obtenerParametros()[1]).toBeNull();
    });

    it('string con solo espacios en body → null', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { posicion: '   ' },
      });
      expect(agg.obtenerParametros()[1]).toBeNull();
    });
  });

  describe('obtenerParametros() — alias snake_case (kills || → && mutants)', () => {
    // Cada test usa SOLO el alias snake_case; si || se cambia a &&, camelCase=undefined
    // devolvería undefined → null, haciendo fallar la aserción.

    it('[5] facies_obs snake_case → se almacena en params[5]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { facies_obs: 'normal' },
      });
      expect(agg.obtenerParametros()[5]).toBe('normal');
    });

    it('[8] estado_nutritivo snake_case → se almacena en params[8]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { estado_nutritivo: 'bueno' },
      });
      expect(agg.obtenerParametros()[8]).toBe('bueno');
    });

    it('[11] frecuencia_respiratoria snake_case → se almacena en params[11]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { frecuencia_respiratoria: '16 rpm' },
      });
      expect(agg.obtenerParametros()[11]).toBe('16 rpm');
    });

    it('[15] piel_color snake_case → se almacena en params[15]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { piel_color: 'rosado' },
      });
      expect(agg.obtenerParametros()[15]).toBe('rosado');
    });

    it('[16] piel_humedad snake_case → se almacena en params[16]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { piel_humedad: 'normohidratada' },
      });
      expect(agg.obtenerParametros()[16]).toBe('normohidratada');
    });

    it('[17] piel_lesiones snake_case → se almacena en params[17]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { piel_lesiones: 'sin lesiones' },
      });
      expect(agg.obtenerParametros()[17]).toBe('sin lesiones');
    });

    it('[18] piel_lesiones_obs snake_case → se almacena en params[18]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { piel_lesiones_obs: 'ninguna' },
      });
      expect(agg.obtenerParametros()[18]).toBe('ninguna');
    });

    it('[19] piel_anexos snake_case → se almacena en params[19]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { piel_anexos: 'normales' },
      });
      expect(agg.obtenerParametros()[19]).toBe('normales');
    });

    it('[20] piel_anexos_obs snake_case → se almacena en params[20]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { piel_anexos_obs: 'sin obs' },
      });
      expect(agg.obtenerParametros()[20]).toBe('sin obs');
    });

    it('[21] tcs_distribucion snake_case → se almacena en params[21]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { tcs_distribucion: 'uniforme' },
      });
      expect(agg.obtenerParametros()[21]).toBe('uniforme');
    });

    it('[22] tcs_distribucion_obs snake_case → se almacena en params[22]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { tcs_distribucion_obs: 'obs distribución' },
      });
      expect(agg.obtenerParametros()[22]).toBe('obs distribución');
    });

    it('[23] tcs_cantidad snake_case → se almacena en params[23]', () => {
      const agg = new ExamenFisicoGeneralAggregate({
        id_historia: VALID_UUID,
        body: { tcs_cantidad: 'moderada' },
      });
      expect(agg.obtenerParametros()[23]).toBe('moderada');
    });
  });

  describe('propagación de errores', () => {
    it('lanza DomainError si id_historia es null', () => {
      expect(
        () => new ExamenFisicoGeneralAggregate({ id_historia: null })
      ).toThrow(DomainError);
    });

    it('lanza MSG_NULL si id_historia es null', () => {
      expect(
        () => new ExamenFisicoGeneralAggregate({ id_historia: null })
      ).toThrow(MSG_NULL);
    });

    it('lanza MSG_FMT si id_historia es string no-UUID', () => {
      expect(
        () => new ExamenFisicoGeneralAggregate({ id_historia: 'no-es-uuid' })
      ).toThrow(MSG_FMT);
    });
  });

  describe('inmutabilidad', () => {
    it('Object.freeze impide mutar el agregado', () => {
      const agg = new ExamenFisicoGeneralAggregate({ id_historia: VALID_UUID });
      expect(() => {
        agg.idHistoria = 'otro';
      }).toThrow();
      expect(agg.idHistoria).toBe(VALID_UUID);
    });
  });
});
