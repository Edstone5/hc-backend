import { describe, it, expect } from 'vitest';
import { DomainError, EpbAggregate } from '../epb/domain/epbDomain.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

const seisSextantes = [
  { sextante: 1, codigo: 0 },
  { sextante: 2, codigo: 1 },
  { sextante: 3, codigo: 2 },
  { sextante: 4, codigo: 3, furca: true },
  { sextante: 5, codigo: 4, movilidad: true },
  { sextante: 6, codigo: 0 },
];

describe('EpbAggregate', () => {
  it('calcula codigoMax como el peor código', () => {
    const agg = new EpbAggregate({ idHistoria: UUID, valores: seisSextantes });
    expect(agg.resumen.codigoMax).toBe(4);
  });

  it('normaliza furca/movilidad a booleano', () => {
    const agg = new EpbAggregate({
      idHistoria: UUID,
      valores: [{ sextante: 1, codigo: 3, furca: 1, movilidad: 0 }],
    });
    const valores = JSON.parse(agg.obtenerParametros()[1]);
    expect(valores[0].furca).toBe(true);
    expect(valores[0].movilidad).toBe(false);
  });

  it('serializa valores como JSON', () => {
    const agg = new EpbAggregate({ idHistoria: UUID, valores: seisSextantes });
    const p = agg.obtenerParametros();
    expect(p[0]).toBe(UUID);
    expect(JSON.parse(p[1])).toHaveLength(6);
    expect(p[2]).toBe(4); // codigo_max
  });

  it('rechaza sextante inválido', () => {
    expect(
      () =>
        new EpbAggregate({
          idHistoria: UUID,
          valores: [{ sextante: 7, codigo: 1 }],
        })
    ).toThrow(DomainError);
  });

  it('rechaza sextante duplicado', () => {
    expect(
      () =>
        new EpbAggregate({
          idHistoria: UUID,
          valores: [
            { sextante: 1, codigo: 1 },
            { sextante: 1, codigo: 2 },
          ],
        })
    ).toThrow(DomainError);
  });

  it('rechaza código OMS fuera de 0-4', () => {
    expect(
      () =>
        new EpbAggregate({
          idHistoria: UUID,
          valores: [{ sextante: 1, codigo: 5 }],
        })
    ).toThrow(DomainError);
  });

  it('rechaza valores vacío', () => {
    expect(() => new EpbAggregate({ idHistoria: UUID, valores: [] })).toThrow(
      DomainError
    );
  });

  it('rechaza id_historia inválido', () => {
    expect(
      () =>
        new EpbAggregate({
          idHistoria: 'no-uuid',
          valores: [{ sextante: 1, codigo: 0 }],
        })
    ).toThrow(DomainError);
  });
});
