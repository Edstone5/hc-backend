import EnfermedadActual from '../../../models/hc/anamnesis/enfermedadActualModel.js';

export const createEnfermedadActual = async (req, res) => {
  try {
    const result = await EnfermedadActual.create(req.body);
    if (!result) {
      return res
        .status(500)
        .json({ error: 'Error al crear enfermedad actual' });
    }
    return res.status(201).json({
      message: 'Enfermedad actual registrada con éxito',
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getEnfermedadActual = async (req, res) => {
  try {
    const result = await EnfermedadActual.getByHistoria(req.params.id_historia);
    if (!result) {
      return res.status(404).json({
        error:
          'No se encontró enfermedad actual para la historia clínica indicada',
      });
    }
    return res.status(200).json({
      message: 'Enfermedad actual obtenida correctamente',
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateEnfermedadActual = async (req, res) => {
  try {
    const existing = await EnfermedadActual.getByHistoria(
      req.params.id_historia
    );
    if (!existing) {
      return res.status(404).json({
        error:
          'No se encontró enfermedad actual para la historia clínica indicada',
      });
    }
    const result = await EnfermedadActual.update(
      req.params.id_historia,
      req.body
    );
    if (!result) {
      return res
        .status(500)
        .json({ error: 'Error al actualizar enfermedad actual' });
    }
    return res.status(200).json({
      message: 'Enfermedad actual actualizada correctamente',
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export default {
  createEnfermedadActual,
  getEnfermedadActual,
  updateEnfermedadActual,
};
