import { describe, it, expect } from 'vitest';
import {
  DomainError,
  IhoSimplificadoAggregate,
  clasificarIhos,
} from '../ihoSimplificado/domain/ihoSimplificadoDomain.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('clasificarIhos', () => {
  it('clasifica Bueno (<=1.2)', () => {
    expect(clasificarIhos(0)).toBe('Bueno');
    expect(clasificarIhos(1.2)).toBe('Bueno');
  });
  it('clasifica Regular (1.3-3.0)', () => {
    expect(clasificarIhos(1.3)).toBe('Regular');
    expect(clasificarIhos(3.0)).toBe('Regular');
  });
  it('clasifica Malo (>3.0)', () => {
    expect(clasificarIhos(3.1)).toBe('Malo');
    expect(clasificarIhos(6)).toBe('Malo');
  });
});

describe('IhoSimplificadoAggregate', () => {
  const seis = [
    { diente: 16, db: 1, dc: 1 },
    { diente: 11, db: 1, dc: 1 },
    { diente: 26, db: 1, dc: 1 },
    { diente: 36, db: 1, dc: 1 },
    { diente: 31, db: 1, dc: 1 },
    { diente: 46, db: 1, dc: 1 },
  ];

  it('calcula idb, icalc, ihos y clasificación', () => {
    const agg = new IhoSimplificadoAggregate({
      idHistoria: UUID,
      valores: seis,
    });
    expect(agg.resumen).toEqual({
      idb: 1,
      icalc: 1,
      ihos: 2,
      clasificacion: 'Regular',
    });
  });

  it('promedia correctamente valores mixtos', () => {
    const agg = new IhoSimplificadoAggregate({
      idHistoria: UUID,
      valores: [
        { diente: 16, db: 3, dc: 0 },
        { diente: 11, db: 0, dc: 0 },
      ],
    });
    // idb = 3/2 = 1.5 ; icalc = 0 ; ihos = 1.5 → Regular
    expect(agg.resumen.idb).toBe(1.5);
    expect(agg.resumen.ihos).toBe(1.5);
    expect(agg.resumen.clasificacion).toBe('Regular');
  });

  it('serializa valores como JSON en los parámetros', () => {
    const agg = new IhoSimplificadoAggregate({
      idHistoria: UUID,
      valores: seis,
    });
    const p = agg.obtenerParametros();
    expect(p[0]).toBe(UUID);
    expect(JSON.parse(p[1])).toHaveLength(6);
  });

  it('rechaza diente índice no válido', () => {
    expect(
      () =>
        new IhoSimplificadoAggregate({
          idHistoria: UUID,
          valores: [{ diente: 17, db: 1, dc: 1 }],
        })
    ).toThrow(DomainError);
  });

  it('rechaza DB/DC fuera de 0-3', () => {
    expect(
      () =>
        new IhoSimplificadoAggregate({
          idHistoria: UUID,
          valores: [{ diente: 16, db: 4, dc: 0 }],
        })
    ).toThrow(DomainError);
  });

  it('rechaza valores vacío', () => {
    expect(
      () => new IhoSimplificadoAggregate({ idHistoria: UUID, valores: [] })
    ).toThrow(DomainError);
  });

  it('rechaza id_historia inválido', () => {
    expect(
      () =>
        new IhoSimplificadoAggregate({
          idHistoria: 'x',
          valores: [{ diente: 16, db: 1, dc: 1 }],
        })
    ).toThrow(DomainError);
  });
});
