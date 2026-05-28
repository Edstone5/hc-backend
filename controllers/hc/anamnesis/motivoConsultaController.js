import BaseService from '../../../services/baseService.js';
import MotivoConsulta from '../../../models/hc/anamnesis/motivoConsultaModel.js';

const service = new BaseService(MotivoConsulta);

export const createMotivoConsulta = async (req, res) => {
  try {
    const ok = await service.create(req.body);
    if (ok) {
      return res
        .status(201)
        .json({ message: 'Motivo de consulta registrado con éxito' });
    }
    return res
      .status(400)
      .json({ error: 'No se pudo registrar el motivo de consulta' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const getMotivoConsulta = async (req, res) => {
  try {
    const result = await MotivoConsulta.getByHistoria(req.params.id_historia);
    if (!result) {
      return res.status(404).json({
        error:
          'No se encontró motivo de consulta para la historia clínica indicada',
      });
    }
    return res.status(200).json({
      message: 'Motivo de consulta obtenido correctamente',
      data: result,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Error al obtener el motivo de consulta' });
  }
};

export const updateMotivoConsulta = async (req, res) => {
  try {
    const existing = await MotivoConsulta.getByHistoria(req.params.id_historia);
    if (!existing) {
      return res.status(404).json({
        error:
          'No se encontró motivo de consulta para la historia clínica indicada',
      });
    }
    const ok = await service.update(req.params.id_historia, req.body);
    if (ok) {
      return res
        .status(200)
        .json({ message: 'Motivo de consulta actualizado correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar el motivo de consulta' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export default {
  createMotivoConsulta,
  getMotivoConsulta,
  updateMotivoConsulta,
};
