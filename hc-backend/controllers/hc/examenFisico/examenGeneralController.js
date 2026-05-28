import BaseService from '../../../services/baseService.js';
import ExamenGeneral from '../../../models/hc/examenFisico/examenGeneralModel.js';

export const examenGeneralService = new BaseService(ExamenGeneral);

export const createExamenGeneral = async (req, res) => {
  try {
    const result = await examenGeneralService.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExamenGeneral = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const result = await ExamenGeneral.getByHistoria(id_historia);
    if (!result) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateExamenGeneral = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const examen = await ExamenGeneral.getByHistoria(id_historia);
    if (!examen) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    const result = await examenGeneralService.update(
      examen.id_examen,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
