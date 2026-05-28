import ExamenGeneral from '../../../models/hc/examenFisico/examenGeneralModel.js';

export const examenGeneralService = {
  create: async (payload) => {
    return await ExamenGeneral.create(payload);
  },
  update: async (payload) => {
    return await ExamenGeneral.update(payload.id_historia ?? payload.id);
  },
};

export const createExamenGeneral = async (req, res) => {
  try {
    const result = await examenGeneralService.create(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getExamenGeneral = async (req, res) => {
  try {
    const result = await ExamenGeneral.getByHistoria(req.params.id_historia);
    if (!result) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateExamenGeneral = async (req, res) => {
  try {
    const existing = await ExamenGeneral.getByHistoria(req.params.id_historia);
    if (!existing) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    const result = await examenGeneralService.update({
      ...req.body,
      id_historia: req.params.id_historia,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export default {
  createExamenGeneral,
  getExamenGeneral,
  updateExamenGeneral,
  examenGeneralService,
};
