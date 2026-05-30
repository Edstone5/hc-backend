import { ReporteRepository } from '../infrastructure/reporteRepository.js';

const repo = new ReporteRepository();

export const ReporteController = {
  resumenAdmin: async (req, res) => {
    try {
      const { desde, hasta, idEstudiante } = req.query;
      const data = await repo.resumenAdmin({ desde, hasta, idEstudiante });
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  resumenDocente: async (req, res) => {
    try {
      const idDocente = req.user?.id;
      return res.status(200).json(await repo.resumenDocente(idDocente));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  exportarAnonimo: async (req, res) => {
    try {
      const { desde, hasta } = req.query;
      const data = await repo.exportarAnonimo({ desde, hasta });
      // Registrar en auditoría quién generó el reporte anónimo
      // (el middleware de auditoría lo captura automáticamente)
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
