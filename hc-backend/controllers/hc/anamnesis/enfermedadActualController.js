import EnfermedadActual from '../../../models/hc/anamnesis/enfermedadActualModel.js';
import BaseService from '../../../services/baseService.js';

const enfermedadActualService = new BaseService(EnfermedadActual);

export const createEnfermedadActual = async (req, res) => {
  try {
    const result = await enfermedadActualService.create(req.body);
    if (!result) {
      return res
        .status(500)
        .json({ error: 'No se pudo registrar la enfermedad actual' });
    }
    res.status(201).json({
      message: 'Enfermedad actual registrada con éxito',
      data: result,
    });
  } catch {
    res.status(500).json({ error: 'Error al registrar la enfermedad actual' });
  }
};

export const getEnfermedadActual = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const result = await EnfermedadActual.getByHistoria(id_historia);
    if (!result) {
      return res.status(404).json({
        error:
          'No se encontró enfermedad actual para la historia clínica indicada',
      });
    }
    res.status(200).json({
      message: 'Enfermedad actual obtenida correctamente',
      data: result,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener la enfermedad actual' });
  }
};

export const updateEnfermedadActual = async (req, res) => {
  try {
    const { id_historia } = req.params;
    // Busca la enfermedad actual por id_historia
    const enfermedad = await EnfermedadActual.getByHistoria(id_historia);
    if (!enfermedad) {
      return res.status(404).json({
        error:
          'No se encontró enfermedad actual para la historia clínica indicada',
      });
    }
    // Actualiza usando el id_historia
    const result = await enfermedadActualService.update(id_historia, req.body);
    if (!result) {
      return res
        .status(500)
        .json({ error: 'No se pudo actualizar la enfermedad actual' });
    }
    res.status(200).json({
      message: 'Enfermedad actual actualizada correctamente',
      data: result,
    });
  } catch {
    res.status(500).json({ error: 'Error al actualizar la enfermedad actual' });
  }
};
