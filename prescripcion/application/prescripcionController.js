import {
  DomainError,
  PrescripcionAggregate,
} from '../domain/prescripcionDomain.js';
import { PrescripcionRepository } from '../infrastructure/prescripcionRepository.js';

const repo = new PrescripcionRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const PrescripcionController = {
  listar: async (req, res) => {
    try {
      return res.status(200).json(await repo.listarPorHistoria(req.params.id));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  registrar: async (req, res) => {
    try {
      const agg = new PrescripcionAggregate({
        idHistoria: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });
      await repo.registrar(agg);
      return res.status(201).json({ message: 'Prescripción registrada' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  eliminar: async (req, res) => {
    try {
      await repo.eliminar(req.params.idPrescripcion);
      return res.status(200).json({ message: 'Prescripción eliminada' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
