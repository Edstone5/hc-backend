import Filiacion from '../../../models/hc/anamnesis/filiacionModel.js';
import BaseService from '../../../services/baseService.js';

const filiacionService = new BaseService(Filiacion);

export const createFiliacion = async (req, res) => {
  try {
    const ok = await filiacionService.create(req.body);
    if (ok) {
      return res
        .status(201)
        .json({ message: 'Filiación registrada con éxito' });
    }
    return res.status(400).json({ error: 'No se pudo registrar la filiación' });
  } catch (err) {
    // console.error('Error en createFiliacion:', err);
    return res
      .status(400)
      .json({ error: err.message || 'Error al registrar la filiación' });
  }
};

export const getFiliacion = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const result = await Filiacion.getByHistoria(id_historia);
    if (!result) {
      return res.status(404).json({
        error: 'No se encontró filiación para la historia clínica indicada',
      });
    }
    res.status(200).json({
      message: 'Filiación obtenida correctamente',
      data: result,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener la filiación' });
  }
};

export const updateFiliacion = async (req, res) => {
  try {
    const { id_historia } = req.params;
    // Busca la filiación por id_historia
    const filiacion = await Filiacion.getByHistoria(id_historia);
    if (!filiacion) {
      return res.status(404).json({
        error: 'No se encontró filiación para la historia clínica indicada',
      });
    }
    // Actualiza usando el id_historia directamente
    const ok = await filiacionService.update(id_historia, req.body);
    if (ok) {
      return res
        .status(200)
        .json({ message: 'Filiación actualizada correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar la filiación' });
  } catch (err) {
    // console.error('Error en updateFiliacion:', err);
    res
      .status(500)
      .json({ error: err.message || 'Error al actualizar la filiación' });
  }
};
