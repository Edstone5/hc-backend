import BaseService from '../../../services/baseService.js';
import ExamenRegional from '../../../models/hc/examenFisico/examenRegionalModel.js';

export const examenRegionalService = new BaseService(ExamenRegional);

export const createExamenRegional = async (req, res) => {
  try {
    const result = await examenRegionalService.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExamenRegional = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const result = await ExamenRegional.getByHistoria(id_historia);
    if (!result) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateExamenRegional = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const examen = await ExamenRegional.getByHistoria(id_historia);
    if (!examen) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    const result = await examenRegionalService.update(
      examen.id_regional,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
