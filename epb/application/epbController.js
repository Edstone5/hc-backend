import { DomainError, EpbAggregate } from '../domain/epbDomain.js';
import { EpbRepository } from '../infrastructure/epbRepository.js';

const repo = new EpbRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const EpbController = {
  consultar: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'id requerido' });
      }
      const row = await repo.consultarPorHistoria(id);
      return res.status(200).json(row || {});
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  guardar: async (req, res) => {
    try {
      const agg = new EpbAggregate({
        idHistoria: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });
      await repo.guardar(agg);
      return res
        .status(201)
        .json({ message: 'EPB guardado', resumen: agg.resumen });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },
};
