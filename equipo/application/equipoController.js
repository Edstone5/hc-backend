import { DomainError, EquipoAggregate } from '../domain/equipoDomain.js';
import { EquipoRepository } from '../infrastructure/equipoRepository.js';

const repo = new EquipoRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const EquipoController = {
  listar: async (req, res) => {
    try {
      return res.status(200).json(await repo.listar());
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
  registrar: async (req, res) => {
    try {
      const agg = new EquipoAggregate(req.body);
      const id = await repo.registrar(agg);
      return res.status(201).json({ id_equipo: id });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },
  actualizar: async (req, res) => {
    try {
      const agg = new EquipoAggregate(req.body);
      await repo.actualizar(req.params.id, agg);
      return res.status(200).json({ message: 'Equipo actualizado' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },
};
