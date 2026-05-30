/**
 * Adaptador Secundario: AdjuntoRepository
 * Persiste metadatos en PostgreSQL/MySQL.
 * Almacenamiento de archivos: Supabase Storage.
 * Hexagonal: cambiar a S3/local implica solo modificar este archivo.
 */
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { IAdjuntoRepository } from '../domain/adjuntoDomain.js';
import pool from '../../db/db.js';

// Lazy init del cliente Supabase (solo si las variables están configuradas)
let supabase = null;
function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL y SUPABASE_KEY requeridas para gestión de adjuntos'
      );
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

const BUCKET = 'adjuntos';

export class AdjuntoRepository extends IAdjuntoRepository {
  async listarPorHistoria(idHistoria) {
    const ob =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha_subida DESC'
        : 'ORDER BY fecha_subida DESC NULLS LAST';
    const r = await pool.query(
      `SELECT id_adjunto, nombre_original, tipo_mime, tamano_bytes, descripcion, fecha_subida
       FROM adjunto WHERE id_historia = $1 ${ob}`,
      [idHistoria]
    );
    return r.rows;
  }

  async registrar(agg, fileBuffer) {
    const sb = getSupabase();
    const storagePath = `${agg.idHistoria}/${agg.nombreStorage}`;

    // Subir archivo a Supabase Storage
    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: agg.tipoMime,
        upsert: false,
      });
    if (uploadErr) {
      throw new Error(`Supabase upload error: ${uploadErr.message}`);
    }

    // Persistir metadatos en BD
    await pool.query(
      `INSERT INTO adjunto (id_adjunto, id_historia, nombre_original, nombre_storage, tipo_mime, tamano_bytes, descripcion, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        randomUUID(),
        agg.idHistoria,
        agg.nombreOriginal,
        storagePath,
        agg.tipoMime,
        agg.tamanoBytes,
        agg.descripcion,
        agg.idUsuario,
      ]
    );
    return true;
  }

  async eliminar(idAdjunto) {
    // Obtener path antes de borrar
    const r = await pool.query(
      'SELECT nombre_storage FROM adjunto WHERE id_adjunto = $1',
      [idAdjunto]
    );
    if (r.rows[0]) {
      const sb = getSupabase();
      await sb.storage.from(BUCKET).remove([r.rows[0].nombre_storage]);
    }
    await pool.query('DELETE FROM adjunto WHERE id_adjunto = $1', [idAdjunto]);
    return true;
  }

  async obtenerUrlDescarga(nombreStorage) {
    const sb = getSupabase();
    const { data } = sb.storage.from(BUCKET).getPublicUrl(nombreStorage);
    return data?.publicUrl || null;
  }
}
