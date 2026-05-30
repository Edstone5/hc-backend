/**
 * Adaptador Primario: ConsentimientoController
 * Maneja las peticiones HTTP para el módulo de Consentimiento Informado (RF-09).
 *
 * Endpoints expuestos (registrados en hcRoutes):
 *   GET  /hc/:id/consentimiento           → listar todos los consentimientos de la HC
 *   POST /hc/:id/consentimiento           → registrar un nuevo consentimiento
 *   DELETE /hc/:id/consentimiento/:idCons → eliminar un consentimiento
 */
import {
  ConsentimientoAggregate,
  DomainError,
} from '../domain/consentimientoDomain.js';
import { ConsentimientoRepository } from '../infrastructure/consentimientoRepository.js';

const repo = new ConsentimientoRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const ConsentimientoController = {
  listar: async (req, res) => {
    try {
      const datos = await repo.listarPorHistoria(req.params.id);
      return res.status(200).json(datos);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  registrar: async (req, res) => {
    try {
      const agg = new ConsentimientoAggregate({
        idHistoria: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });
      const nuevo = await repo.registrar(agg);
      return res.status(201).json(nuevo);
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  eliminar: async (req, res) => {
    try {
      await repo.eliminar(req.params.idConsentimiento);
      return res.status(200).json({ message: 'Consentimiento eliminado' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
