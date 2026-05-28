import pool from '../../../db/db.js';

const TABLE = 'examen_regional';

class ExamenRegional {
  static async create(data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const fields = keys.join(', ');
      const params = keys.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${TABLE} (${fields}) VALUES (${params}) RETURNING *`;
      const { rows } = await pool.query(query, values);
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch {
      // console.error('Error al crear examen regional');
      return null;
    }
  }

  static async getByHistoria(id_historia) {
    try {
      const query = `SELECT * FROM ${TABLE} WHERE id_historia = $1 LIMIT 1`;
      const { rows } = await pool.query(query, [id_historia]);
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch {
      // console.error('Error al obtener examen regional por historia');
      return null;
    }
  }

  static async update(id_regional, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
      const query = `UPDATE ${TABLE} SET ${setClause} WHERE id_regional = $1 RETURNING *`;
      const { rows } = await pool.query(query, [id_regional, ...values]);
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch {
      // console.error('Error al actualizar examen regional');
      return null;
    }
  }
}

export default ExamenRegional;
