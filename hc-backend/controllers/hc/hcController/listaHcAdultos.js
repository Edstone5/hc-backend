// Controlador para obtener historias clínicas de pacientes adultos de un estudiante específico
import { getAdultHistoriasByStudent } from '../../../models/hc/hcModels/listaHcAdultos.js';

export const listaHcAdultos = async (req, res) => {
  try {
    const { id } = req.params;
    const historias = await getAdultHistoriasByStudent(id);
    if (!historias || historias.length === 0) {
      return res.status(200).json([]);
    }
    return res.status(200).json(historias);
  } catch (error) {
    // console.error('Error en listaHcAdultos:', error);
    return res.status(500).json({
      error: error.message || 'Error al obtener historias clínicas adultas.',
    });
  }
};
