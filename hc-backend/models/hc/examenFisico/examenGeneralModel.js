import pool from '../../../db/db.js';

const TABLE = 'examen_general';

class ExamenGeneral {
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
      // console.error('Error al crear examen general');
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
      // console.error('Error al obtener examen general por historia');
      return null;
    }
  }

  static async update(id_examen, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
      const query = `UPDATE ${TABLE} SET ${setClause} WHERE id_examen = $1 RETURNING *`;
      const { rows } = await pool.query(query, [id_examen, ...values]);
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch {
      // console.error('Error al actualizar examen general');
      return null;
    }
  }
}

export default ExamenGeneral;
