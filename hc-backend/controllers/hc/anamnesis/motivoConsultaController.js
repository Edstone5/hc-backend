import MotivoConsulta from '../../../models/hc/anamnesis/motivoConsultaModel.js';
import BaseService from '../../../services/baseService.js';

const motivoConsultaService = new BaseService(MotivoConsulta);
export const createMotivoConsulta = async (req, res) => {
  try {
    const ok = await motivoConsultaService.create(req.body);
    if (ok) {
      return res
        .status(201)
        .json({ message: 'Motivo de consulta registrado con éxito' });
    }
    return res
      .status(400)
      .json({ error: 'No se pudo registrar el motivo de consulta' });
  } catch (err) {
    // console.error('Error en createMotivoConsulta:', err);
    return res.status(400).json({
      error: err.message || 'Error al registrar el motivo de consulta',
    });
  }
};

export const getMotivoConsulta = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const result = await MotivoConsulta.getByHistoria(id_historia);
    if (!result) {
      return res.status(404).json({
        error:
          'No se encontró motivo de consulta para la historia clínica indicada',
      });
    }
    res.status(200).json({
      message: 'Motivo de consulta obtenido correctamente',
      data: result,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener el motivo de consulta' });
  }
};

export const updateMotivoConsulta = async (req, res) => {
  try {
    const { id_historia } = req.params;
    // Busca el motivo por id_historia
    const motivo = await MotivoConsulta.getByHistoria(id_historia);
    if (!motivo) {
      return res.status(404).json({
        error:
          'No se encontró motivo de consulta para la historia clínica indicada',
      });
    }
    // Actualiza usando el id_historia
    const ok = await motivoConsultaService.update(id_historia, req.body);
    if (ok) {
      return res
        .status(200)
        .json({ message: 'Motivo de consulta actualizado correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar el motivo de consulta' });
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Error al actualizar el motivo de consulta',
    });
  }
};
