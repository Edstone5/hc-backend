import { DomainError, PagoAggregate } from '../domain/pagoDomain.js';
import { PagoRepository } from '../infrastructure/pagoRepository.js';

const repo = new PagoRepository();

function esErrorDominio(err) {
  return err && (err instanceof DomainError || err.name === 'DomainError');
}

export const PagoController = {
  registrarPago: async (req, res) => {
    try {
      const idHistoria = req.params.id || req.body.id_historia;
      const monto = req.body.monto ?? 2.0;
      const idAdmin = req.user?.id || null;
      const agregado = new PagoAggregate({ idHistoria, monto, idAdmin });
      await repo.registrarPago(agregado);
      return res.status(201).json({ message: 'Pago registrado correctamente' });
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  },

  consultarPorHistoria: async (req, res) => {
    try {
      const idHistoria = req.params.id;
      if (!idHistoria) {
        return res.status(400).json({ error: 'id_historia requerido' });
      }
      const pagos = await repo.consultarPorHistoria(idHistoria);
      return res.status(200).json(pagos);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
