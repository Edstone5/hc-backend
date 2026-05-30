import { describe, it, expect } from 'vitest';
import {
  DomainError,
  OdontogramaEntradaAggregate,
  OdontogramaSvgAggregate,
} from '../odontograma/domain/odontogramaDomain.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// ── OdontogramaEntradaAggregate ──────────────────────────────────────────────
describe('OdontogramaEntradaAggregate', () => {
  it('construye con valores mínimos válidos (tipo default EVOLUCION)', () => {
    const agg = new OdontogramaEntradaAggregate({
      idHistoria: VALID_UUID,
      numeroDiente: 16,
    });
    const p = agg.obtenerParametros();
    // [idHistoria, diente, superficie, diagnostico, tratamiento, fecha, alumno, tipo, hallazgo, idUsuario]
    expect(p[0]).toBe(VALID_UUID);
    expect(p[1]).toBe(16);
    expect(p[7]).toBe('EVOLUCION');
    expect(p[8]).toBeNull(); // hallazgo opcional
  });

  it('acepta tipo INICIAL (case-insensitive)', () => {
    const agg = new OdontogramaEntradaAggregate({
      idHistoria: VALID_UUID,
      numeroDiente: 11,
      tipo: 'inicial',
    });
    expect(agg.obtenerParametros()[7]).toBe('INICIAL');
  });

  it('rechaza tipo inválido', () => {
    expect(
      () =>
        new OdontogramaEntradaAggregate({
          idHistoria: VALID_UUID,
          numeroDiente: 11,
          tipo: 'PROVISIONAL',
        })
    ).toThrow(DomainError);
  });

  it('acepta un código de hallazgo del catálogo (C)', () => {
    const agg = new OdontogramaEntradaAggregate({
      idHistoria: VALID_UUID,
      numeroDiente: 16,
      codigoHallazgo: 'C',
    });
    expect(agg.obtenerParametros()[8]).toBe('C');
  });

  it('rechaza un código de hallazgo fuera del catálogo', () => {
    expect(
      () =>
        new OdontogramaEntradaAggregate({
          idHistoria: VALID_UUID,
          numeroDiente: 16,
          codigoHallazgo: 'ZZZ',
        })
    ).toThrow(DomainError);
  });

  it('rechaza diente fuera del rango FDI', () => {
    expect(
      () =>
        new OdontogramaEntradaAggregate({
          idHistoria: VALID_UUID,
          numeroDiente: 99,
        })
    ).toThrow(DomainError);
  });

  it('acepta diente deciduo (FDI 51-85)', () => {
    const agg = new OdontogramaEntradaAggregate({
      idHistoria: VALID_UUID,
      numeroDiente: 55,
    });
    expect(agg.obtenerParametros()[1]).toBe(55);
  });
});

// ── OdontogramaSvgAggregate ──────────────────────────────────────────────────
describe('OdontogramaSvgAggregate', () => {
  it('construye con SVG y tipo válidos', () => {
    const agg = new OdontogramaSvgAggregate({
      idHistoria: VALID_UUID,
      tipo: 'INICIAL',
      svg: '<svg></svg>',
    });
    const p = agg.obtenerParametros();
    expect(p[0]).toBe(VALID_UUID);
    expect(p[1]).toBe('INICIAL');
    expect(p[2]).toBe('<svg></svg>');
  });

  it('rechaza SVG vacío', () => {
    expect(
      () =>
        new OdontogramaSvgAggregate({
          idHistoria: VALID_UUID,
          tipo: 'INICIAL',
          svg: '   ',
        })
    ).toThrow(DomainError);
  });

  it('rechaza id_historia inválido', () => {
    expect(
      () =>
        new OdontogramaSvgAggregate({
          idHistoria: 'no-es-uuid',
          tipo: 'EVOLUCION',
          svg: '<svg/>',
        })
    ).toThrow(DomainError);
  });
});
