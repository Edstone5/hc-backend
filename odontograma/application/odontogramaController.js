import {
  DomainError,
  OdontogramaEntradaAggregate,
} from '../domain/odontogramaDomain.js';
import { OdontogramaRepository } from '../infrastructure/odontogramaRepository.js';

const repo = new OdontogramaRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const OdontogramaController = {
  listar: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'id requerido' });
      }
      const rows = await repo.listarPorHistoria(id);
      return res.status(200).json(rows);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  registrar: async (req, res) => {
    try {
      const agg = new OdontogramaEntradaAggregate({
        idHistoria: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });
      await repo.registrarEntrada(agg);
      return res
        .status(201)
        .json({ message: 'Entrada de odontograma registrada' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  eliminar: async (req, res) => {
    try {
      await repo.eliminarEntrada(req.params.idEntrada);
      return res.status(200).json({ message: 'Entrada eliminada' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
