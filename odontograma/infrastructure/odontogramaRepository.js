import { randomUUID } from 'crypto';
import { IOdontogramaRepository } from '../domain/odontogramaDomain.js';
import pool from '../../db/db.js';

// Fecha actual en formato YYYY-MM-DD, válida para MySQL y PostgreSQL.
// Evita insertar NULL en columnas DATE NOT NULL cuando el cliente no envía fecha.
const hoyISO = () => new Date().toISOString().slice(0, 10);

export class OdontogramaRepository extends IOdontogramaRepository {
  async listarPorHistoria(idHistoria) {
    const orderBy =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha DESC'
        : 'ORDER BY fecha DESC NULLS LAST';
    const r = await pool.query(
      `SELECT * FROM odontograma_entrada WHERE id_historia = $1 ${orderBy}`,
      [idHistoria]
    );
    return r.rows;
  }

  async registrarEntrada(agg) {
    const [
      idHistoria,
      numeroDiente,
      superficie,
      diagnostico,
      tratamiento,
      fecha,
      alumno,
      tipo,
      idUsuario,
    ] = agg.obtenerParametros();
    await pool.query(
      `INSERT INTO odontograma_entrada
        (id_entrada, id_historia, numero_diente, superficie, diagnostico, tratamiento, fecha, alumno, tipo, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        randomUUID(),
        idHistoria,
        numeroDiente,
        superficie,
        diagnostico,
        tratamiento,
        fecha || hoyISO(),
        alumno,
        tipo,
        idUsuario,
      ]
    );
    return true;
  }

  async eliminarEntrada(idEntrada) {
    await pool.query('DELETE FROM odontograma_entrada WHERE id_entrada = $1', [
      idEntrada,
    ]);
    return true;
  }

  // ── SVG serializado (enfoque híbrido RF-06) ──────────────────────────────
  async listarSvgPorHistoria(idHistoria, tipo = null) {
    const params = [idHistoria];
    let where = 'WHERE id_historia = $1';
    if (tipo) {
      params.push(tipo);
      where += ' AND tipo = $2';
    }
    const r = await pool.query(
      `SELECT * FROM odontograma_svg ${where} ORDER BY created_at DESC`,
      params
    );
    return r.rows;
  }

  async guardarSvg(agg) {
    const [
      idHistoria,
      tipo,
      svg,
      especificaciones,
      observaciones,
      fecha,
      idUsuario,
    ] = agg.obtenerParametros();
    await pool.query(
      `INSERT INTO odontograma_svg
        (id_svg, id_historia, tipo, svg, especificaciones, observaciones, fecha, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        randomUUID(),
        idHistoria,
        tipo,
        svg,
        especificaciones,
        observaciones,
        fecha || hoyISO(),
        idUsuario,
      ]
    );
    return true;
  }
}
