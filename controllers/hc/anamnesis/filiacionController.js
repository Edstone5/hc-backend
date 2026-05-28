import Filiacion from '../../../models/hc/anamnesis/filiacionModel.js';

export const createFiliacion = async (req, res) => {
  try {
    const ok = await Filiacion.create(req.body);
    if (ok === true || (ok && ok.success)) {
      return res
        .status(201)
        .json({ message: 'Filiación registrada con éxito' });
    }
    return res.status(400).json({ error: 'No se pudo registrar la filiación' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getFiliacion = async (req, res) => {
  try {
    const result = await Filiacion.getByHistoria(req.params.id_historia);
    if (!result) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    return res
      .status(200)
      .json({ message: 'Filiación obtenida correctamente', data: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateFiliacion = async (req, res) => {
  try {
    const existente = await Filiacion.getByHistoria(req.params.id_historia);
    if (!existente) {
      return res.status(404).json({ error: 'No se encontro filiacion' });
    }
    const ok = await Filiacion.update(req.body);
    if (ok === true || (ok && ok.success)) {
      return res
        .status(200)
        .json({ message: 'Filiación actualizada correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar la filiación' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export default {
  createFiliacion,
  getFiliacion,
  updateFiliacion,
};
