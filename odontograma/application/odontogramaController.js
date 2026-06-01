import {
  DomainError,
  OdontogramaEntradaAggregate,
  OdontogramaSvgAggregate,
  validarExclusion,
  agregarReporteOdontograma,
} from '../domain/odontogramaDomain.js';
import { OdontogramaRepository } from '../infrastructure/odontogramaRepository.js';

const repo = new OdontogramaRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

export const OdontogramaController = {
  listar: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'id requerido' });
      }
      const rows = await repo.listarPorHistoria(id);
      return res.status(200).json(rows);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  registrar: async (req, res) => {
    try {
      const agg = new OdontogramaEntradaAggregate({
        idHistoria: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });

      // Reglas de exclusión clínica (NTS-188 / ADR-0021, ADR-0022): pieza ausente
      // (DNE/DEX/DAO) no admite otros hallazgos, y grupos de exclusión mutua
      // (tamaño, giroversión, corona) en el mismo diente y tipo. La BD es garante
      // de integridad, no solo el cliente.
      const existentes = await repo.listarPorHistoria(req.params.id);
      const codigosMismaPieza = existentes
        .filter(
          (r) =>
            Number(r.numero_diente) === agg.numeroDiente &&
            String(r.tipo || '').toUpperCase() === agg.tipo
        )
        .map((r) => r.codigo_hallazgo)
        .filter(Boolean);
      const exclusion = validarExclusion(agg.codigoHallazgo, codigosMismaPieza);
      if (!exclusion.ok) {
        return res.status(409).json({ error: exclusion.motivo });
      }

      await repo.registrarEntrada(agg);
      return res
        .status(201)
        .json({ message: 'Entrada de odontograma registrada' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  // ── Reporte agregado multi-paciente (RF-12) ──────────────────────────────
  // GET /odontograma/reporte/prevalencia?tipo=&alumno=&desde=&hasta=
  // Prevalencia de caries (global y por diente) + índice CPO-D promedio.
  reportePrevalencia: async (req, res) => {
    try {
      const { tipo, alumno, desde, hasta } = req.query;
      const filtros = {
        tipo: tipo ? String(tipo).toUpperCase() : null,
        alumno: alumno || null,
        desde: desde || null,
        hasta: hasta || null,
      };
      const filas = await repo.listarEntradasParaReporte(filtros);
      const reporte = agregarReporteOdontograma(filas);
      return res.status(200).json(reporte);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  eliminar: async (req, res) => {
    try {
      await repo.eliminarEntrada(req.params.idEntrada);
      return res.status(200).json({ message: 'Entrada eliminada' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  // ── SVG serializado (enfoque híbrido RF-06) ──────────────────────────────
  // GET /:id/odontograma/svg?tipo=INICIAL|EVOLUCION
  listarSvg: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'id requerido' });
      }
      const tipo = req.query.tipo ? String(req.query.tipo).toUpperCase() : null;
      const rows = await repo.listarSvgPorHistoria(id, tipo);
      return res.status(200).json(rows);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  // POST /:id/odontograma/svg
  guardarSvg: async (req, res) => {
    try {
      const agg = new OdontogramaSvgAggregate({
        idHistoria: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });
      await repo.guardarSvg(agg);
      return res
        .status(201)
        .json({ message: 'Odontograma (SVG) guardado en la historia' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },
};
