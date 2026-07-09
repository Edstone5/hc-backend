import {
  DomainError,
  InformeFinalAggregate,
} from '../domain/informeFinalDomain.js';
import { InformeFinalRepository } from '../infrastructure/informeFinalRepository.js';
import { NotificacionAggregate } from '../../notificacion/domain/notificacionDomain.js';
import { NotificacionRepository } from '../../notificacion/infrastructure/notificacionRepository.js';

const repo = new InformeFinalRepository();
const notificaciones = new NotificacionRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const InformeFinalController = {
  // RF-13: genera el informe final compilando las secciones del caso.
  generar: async (req, res) => {
    try {
      const agg = new InformeFinalAggregate({
        idHistoria: req.params.id,
        generadoPor: req.user?.id,
        secciones: req.body?.secciones,
      });
      const id = await repo.registrar(agg);
      return res.status(201).json({
        id_informe: id,
        estado: agg.estado,
        completo: agg.esCompleto(),
        message: 'Informe final generado',
      });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  // RF-13: historial de informes generados por historia clínica.
  listarPorHistoria: async (req, res) => {
    try {
      return res.status(200).json(await repo.listarPorHistoria(req.params.id));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  // RF-13: marca el informe como enviado para validación y notifica al docente.
  enviarParaValidacion: async (req, res) => {
    try {
      const fila = await repo.obtenerPorId(req.params.idInforme);
      if (!fila) {
        return res.status(404).json({ error: 'informe no encontrado' });
      }
      const agg = new InformeFinalAggregate({
        idHistoria: fila.id_historia,
        generadoPor: fila.generado_por,
        estado: fila.estado,
        secciones:
          typeof fila.secciones === 'string'
            ? JSON.parse(fila.secciones)
            : fila.secciones,
      });
      agg.enviarParaValidacion();
      await repo.actualizarEstado(req.params.idInforme, agg.estado);

      let notificado = false;
      const idDocente = req.body?.idDocente;
      if (idDocente) {
        try {
          const notif = new NotificacionAggregate({
            idDestinatario: idDocente,
            titulo: 'Informe final enviado para validación',
            mensaje: `El informe final de la historia ${agg.idHistoria} espera su validación.`,
            tipo: 'validacion',
            idReferencia: req.params.idInforme,
          });
          await notificaciones.registrar(notif);
          notificado = true;
        } catch {
          notificado = false;
        }
      }
      return res.status(200).json({
        estado: agg.estado,
        docenteNotificado: notificado,
        message: 'Informe enviado para validación',
      });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },
};
