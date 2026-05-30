import {
  DomainError,
  FichaEvaluacionAggregate,
} from '../domain/fichaEvaluacionDomain.js';
import { FichaEvaluacionRepository } from '../infrastructure/fichaEvaluacionRepository.js';

const repo = new FichaEvaluacionRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const FichaEvaluacionController = {
  obtenerPorFicha: async (req, res) => {
    try {
      const ev = await repo.obtenerPorFicha(req.params.idFicha);
      return res.status(200).json(ev || {});
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  evaluar: async (req, res) => {
    try {
      const agg = new FichaEvaluacionAggregate({
        idFicha: req.params.idFicha,
        idHistoria: req.params.id,
        ...req.body,
        idDocente: req.user?.id,
      });
      const existente = await repo.obtenerPorFicha(req.params.idFicha);
      if (existente) {
        await repo.actualizar(existente.id_evaluacion, agg);
        return res.status(200).json({ message: 'Evaluación actualizada' });
      }
      const id = await repo.registrar(agg);
      return res
        .status(201)
        .json({ id_evaluacion: id, message: 'Evaluación registrada' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  listarPorDocente: async (req, res) => {
    try {
      const idDocente = req.user?.id;
      return res.status(200).json(await repo.listarPorDocente(idDocente));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
