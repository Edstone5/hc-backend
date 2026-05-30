/**
 * Controlador de adjuntos.
 * multer procesa el multipart ANTES de llegar al dominio.
 * El dominio valida tipo/tamaño; el repositorio sube a Supabase.
 */
import { randomUUID } from 'crypto';
import multer from 'multer';
import { DomainError, AdjuntoAggregate } from '../domain/adjuntoDomain.js';
import { AdjuntoRepository } from '../infrastructure/adjuntoRepository.js';
import pool from '../../db/db.js';

const repo = new AdjuntoRepository();
const esErr = (e) =>
  e && (e instanceof DomainError || e.name === 'DomainError');

// multer en memoria (no escribe en disco; el repo lo sube directamente a Supabase)
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('archivo');

export const AdjuntoController = {
  listar: async (req, res) => {
    try {
      return res.status(200).json(await repo.listarPorHistoria(req.params.id));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  subir: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo' });
      }

      const ext = req.file.originalname.split('.').pop();
      const nombreStorage = `${randomUUID()}.${ext}`;

      const agg = new AdjuntoAggregate({
        idHistoria: req.params.id,
        nombreOriginal: req.file.originalname,
        nombreStorage,
        tipoMime: req.file.mimetype,
        tamanoBytes: req.file.size,
        descripcion: req.body.descripcion || null,
        idUsuario: req.user?.id,
      });

      await repo.registrar(agg, req.file.buffer);
      return res.status(201).json({ message: 'Archivo subido correctamente' });
    } catch (e) {
      if (esErr(e)) {
        return res.status(400).json({ error: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  },

  eliminar: async (req, res) => {
    try {
      await repo.eliminar(req.params.idAdjunto);
      return res.status(200).json({ message: 'Adjunto eliminado' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  urlDescarga: async (req, res) => {
    try {
      const r = await pool.query(
        'SELECT nombre_storage FROM adjunto WHERE id_adjunto = $1',
        [req.params.idAdjunto]
      );
      if (!r.rows[0]) {
        return res.status(404).json({ error: 'Adjunto no encontrado' });
      }
      const url = await repo.obtenerUrlDescarga(r.rows[0].nombre_storage);
      return res.status(200).json({ url });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },
};
