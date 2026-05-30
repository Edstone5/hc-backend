import { NotificacionRepository } from '../infrastructure/notificacionRepository.js';

const repo = new NotificacionRepository();

export const NotificacionController = {
  listar: async (req, res) => {
    try {
      const idUsuario = req.user?.id;
      return res.status(200).json(await repo.listarPorUsuario(idUsuario));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  contarNoLeidas: async (req, res) => {
    try {
      const total = await repo.contarNoLeidas(req.user?.id);
      return res.status(200).json({ total });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  marcarLeida: async (req, res) => {
    try {
      await repo.marcarLeida(req.params.idNotif);
      return res
        .status(200)
        .json({ message: 'Notificación marcada como leída' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  marcarTodasLeidas: async (req, res) => {
    try {
      await repo.marcarTodasLeidas(req.user?.id);
      return res
        .status(200)
        .json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};

/**
 * Helper exportado para que otros controladores puedan crear notificaciones.
 * Uso: await crearNotificacion({ idDestinatario, titulo, mensaje, tipo, idReferencia })
 */
export async function crearNotificacion({
  idDestinatario,
  titulo,
  mensaje,
  tipo = 'sistema',
  idReferencia = null,
}) {
  try {
    const { NotificacionAggregate } = await import(
      '../domain/notificacionDomain.js'
    );
    const agg = new NotificacionAggregate({
      idDestinatario,
      titulo,
      mensaje,
      tipo,
      idReferencia,
    });
    await repo.registrar(agg);
  } catch {
    // Silencio: las notificaciones no deben bloquear el flujo principal
  }
}
