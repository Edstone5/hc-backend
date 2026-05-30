import { describe, it, expect } from 'vitest';
import { DomainError, PagoAggregate } from '../pago/domain/pagoDomain.js';

const VALID_HC = '550e8400-e29b-41d4-a716-446655440000';
const VALID_ADMIN = '660f9500-f39c-41d4-b827-557766551111';

describe('PagoAggregate', () => {
  describe('construcción válida', () => {
    it('construye con monto por defecto 2.00', () => {
      const agg = new PagoAggregate({
        idHistoria: VALID_HC,
        idAdmin: VALID_ADMIN,
      });
      const [idH, monto] = agg.obtenerParametros();
      expect(idH).toBe(VALID_HC);
      expect(monto).toBe(2.0);
    });

    it('construye con monto personalizado', () => {
      const agg = new PagoAggregate({
        idHistoria: VALID_HC,
        monto: 5.5,
        idAdmin: VALID_ADMIN,
      });
      expect(agg.obtenerParametros()[1]).toBe(5.5);
    });

    it('admite idAdmin null', () => {
      const agg = new PagoAggregate({ idHistoria: VALID_HC });
      expect(agg.obtenerParametros()[2]).toBeNull();
    });
  });

  describe('invariantes', () => {
    it('id_historia vacío lanza DomainError', () => {
      expect(() => new PagoAggregate({ idHistoria: '' })).toThrow(
        'id_historia es requerido'
      );
    });

    it('id_historia inválido lanza DomainError', () => {
      expect(() => new PagoAggregate({ idHistoria: 'no-uuid' })).toThrow(
        'id_historia inválido'
      );
    });

    it('monto negativo lanza DomainError', () => {
      expect(
        () => new PagoAggregate({ idHistoria: VALID_HC, monto: -1 })
      ).toThrow('monto debe ser un número positivo');
    });

    it('monto cero lanza DomainError', () => {
      expect(
        () => new PagoAggregate({ idHistoria: VALID_HC, monto: 0 })
      ).toThrow('monto debe ser un número positivo');
    });
  });
});
