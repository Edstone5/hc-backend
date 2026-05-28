import ExamenRegional from '../../../models/hc/examenFisico/examenRegionalModel.js';

export const examenRegionalService = {
  create: async (payload) => await ExamenRegional.create(payload),
  update: async (payload) =>
    await ExamenRegional.update(payload.id_historia ?? payload.id),
};

export const createExamenRegional = async (req, res) => {
  try {
    const result = await examenRegionalService.create(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getExamenRegional = async (req, res) => {
  try {
    const result = await ExamenRegional.getByHistoria(req.params.id_historia);
    if (!result) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateExamenRegional = async (req, res) => {
  try {
    const existing = await ExamenRegional.getByHistoria(req.params.id_historia);
    if (!existing) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    const result = await examenRegionalService.update({
      ...req.body,
      id_historia: req.params.id_historia,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export default {
  createExamenRegional,
  getExamenRegional,
  updateExamenRegional,
  examenRegionalService,
};
