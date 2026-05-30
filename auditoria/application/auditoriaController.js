import { AuditoriaRepository } from '../infrastructure/auditoriaRepository.js';

const repo = new AuditoriaRepository();

export const AuditoriaController = {
  listarPorHistoria: async (req, res) => {
    try {
      return res.status(200).json(await repo.listarPorHistoria(req.params.id));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  listarGeneral: async (req, res) => {
    try {
      const { idUsuario, tabla, desde, hasta } = req.query;
      return res
        .status(200)
        .json(await repo.listarGeneral({ idUsuario, tabla, desde, hasta }));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
