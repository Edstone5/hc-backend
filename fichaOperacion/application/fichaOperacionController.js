import {
  DomainError,
  FichaOperacionAggregate,
} from '../domain/fichaOperacionDomain.js';
import { FichaOperacionRepository } from '../infrastructure/fichaOperacionRepository.js';

const repo = new FichaOperacionRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const FichaOperacionController = {
  listar: async (req, res) => {
    try {
      return res.status(200).json(await repo.listarPorHistoria(req.params.id));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  obtener: async (req, res) => {
    try {
      const ficha = await repo.obtenerPorId(req.params.idFicha);
      if (!ficha) {
        return res.status(404).json({ error: 'Ficha no encontrada' });
      }
      return res.status(200).json(ficha);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  registrar: async (req, res) => {
    try {
      const agg = new FichaOperacionAggregate({
        idHistoria: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });
      const id = await repo.registrar(agg);
      return res
        .status(201)
        .json({ id_ficha: id, message: 'Ficha registrada' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  actualizar: async (req, res) => {
    try {
      const fichaActual = await repo.obtenerPorId(req.params.idFicha);
      if (!fichaActual) {
        return res.status(404).json({ error: 'Ficha no encontrada' });
      }

      const agg = new FichaOperacionAggregate({
        idHistoria: fichaActual.id_historia,
        ...req.body,
        idUsuario: req.user?.id,
      });

      // Registrar auditoría por campo cambiado
      const camposAudit = [
        'diagnostico',
        'procedimiento',
        'materiales',
        'observaciones',
        'estado',
      ];
      for (const campo of camposAudit) {
        const anterior = fichaActual[campo];
        const nuevo = agg[campo];
        if (anterior !== nuevo && (anterior || nuevo)) {
          await repo.registrarAuditoria(
            req.params.idFicha,
            campo,
            anterior,
            nuevo,
            req.user?.id
          );
        }
      }

      await repo.actualizar(req.params.idFicha, agg);
      return res.status(200).json({ message: 'Ficha actualizada' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  eliminar: async (req, res) => {
    try {
      await repo.eliminar(req.params.idFicha);
      return res.status(200).json({ message: 'Ficha eliminada' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  listarAuditoria: async (req, res) => {
    try {
      return res
        .status(200)
        .json(await repo.listarAuditoriaPorFicha(req.params.idFicha));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
