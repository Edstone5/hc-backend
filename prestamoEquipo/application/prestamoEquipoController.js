import {
  DomainError,
  PrestamoEquipoAggregate,
} from '../domain/prestamoEquipoDomain.js';
import { PrestamoEquipoRepository } from '../infrastructure/prestamoEquipoRepository.js';

const repo = new PrestamoEquipoRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const PrestamoEquipoController = {
  listar: async (req, res) => {
    try {
      const { estado } = req.query;
      const idEstudiante =
        req.user?.role === 'estudiante' ? req.user.id : undefined;
      return res.status(200).json(await repo.listar({ idEstudiante, estado }));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  registrar: async (req, res) => {
    try {
      const agg = new PrestamoEquipoAggregate({
        ...req.body,
        idAdmin: req.user?.id,
      });
      const id = await repo.registrar(agg);
      return res
        .status(201)
        .json({ id_prestamo: id, message: 'Préstamo registrado' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  devolver: async (req, res) => {
    try {
      await repo.devolver(req.params.id);
      return res.status(200).json({ message: 'Devolución registrada' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
