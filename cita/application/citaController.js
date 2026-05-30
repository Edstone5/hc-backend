import { DomainError, CitaAggregate } from '../domain/citaDomain.js';
import { CitaRepository } from '../infrastructure/citaRepository.js';
import { crearNotificacion } from '../../notificacion/application/notificacionController.js';

const repo = new CitaRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const CitaController = {
  listarPorHistoria: async (req, res) => {
    try {
      return res.status(200).json(await repo.listarPorHistoria(req.params.id));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  listarPorEstudiante: async (req, res) => {
    try {
      const { desde, hasta } = req.query;
      const idEstudiante = req.user?.id;
      return res
        .status(200)
        .json(await repo.listarPorEstudiante(idEstudiante, desde, hasta));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  registrar: async (req, res) => {
    try {
      const idEstudiante = req.user?.id;
      const agg = new CitaAggregate({
        idHistoria: req.params.id,
        idEstudiante,
        ...req.body,
        idUsuario: req.user?.id,
      });

      // Verificar solapamiento
      const solapa = await repo.verificarSolapamiento(
        idEstudiante,
        agg.fechaHora,
        agg.duracionMin
      );
      if (solapa) {
        return res
          .status(409)
          .json({ error: 'Ya tienes una cita programada en ese horario' });
      }

      const id = await repo.registrar(agg);

      // Notificar al estudiante
      await crearNotificacion({
        idDestinatario: idEstudiante,
        titulo: 'Cita programada',
        mensaje: `Cita registrada para ${new Date(agg.fechaHora).toLocaleString('es-PE')}`,
        tipo: 'cita',
        idReferencia: id,
      });

      return res.status(201).json({ id_cita: id, message: 'Cita registrada' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  actualizarEstado: async (req, res) => {
    try {
      const ESTADOS = ['programada', 'confirmada', 'cancelada', 'completada'];
      const { estado } = req.body;
      if (!ESTADOS.includes(estado)) {
        return res
          .status(400)
          .json({ error: `estado inválido: ${ESTADOS.join(', ')}` });
      }
      await repo.actualizarEstado(req.params.idCita, estado);
      return res.status(200).json({ message: 'Estado de cita actualizado' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  eliminar: async (req, res) => {
    try {
      await repo.eliminar(req.params.idCita);
      return res.status(200).json({ message: 'Cita eliminada' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
