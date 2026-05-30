import { randomUUID } from 'crypto';
import { IEquipoRepository } from '../domain/equipoDomain.js';
import pool from '../../db/db.js';

export class EquipoRepository extends IEquipoRepository {
  async listar() {
    const r = await pool.query('SELECT * FROM equipo ORDER BY nombre ASC');
    return r.rows;
  }
  async obtenerPorId(id) {
    const r = await pool.query('SELECT * FROM equipo WHERE id_equipo = $1', [
      id,
    ]);
    return r.rows[0] || null;
  }
  async registrar(agg) {
    const id = randomUUID();
    await pool.query(
      'INSERT INTO equipo (id_equipo, nombre, descripcion, codigo, estado) VALUES ($1,$2,$3,$4,$5)',
      [id, agg.nombre, agg.descripcion, agg.codigo, agg.estado]
    );
    return id;
  }
  async actualizar(id, agg) {
    await pool.query(
      'UPDATE equipo SET nombre=$1, descripcion=$2, codigo=$3, estado=$4 WHERE id_equipo=$5',
      [agg.nombre, agg.descripcion, agg.codigo, agg.estado, id]
    );
    return true;
  }
}
