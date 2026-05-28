import pool from '../../../db/db.js';

class MotivoConsulta {
  static async create({ id_historia, motivo }) {
    try {
      const query = `CALL i_motivo_consulta($1, $2)`;
      const values = [id_historia, motivo];
      await pool.query(query, values);
      return true;
    } catch (error) {
      // console.error('Error al crear motivo de consulta');
      throw new Error(error.message || 'Error al crear motivo de consulta');
    }
  }

  static async getById(id_motivo) {
    try {
      const query = `SELECT * FROM motivo_consulta WHERE id_motivo = $1`;
      const { rows } = await pool.query(query, [id_motivo]);
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch {
      // console.error('Error al obtener motivo de consulta por ID');
      return null;
    }
  }

  static async getByHistoria(id_historia) {
    try {
      const query = `SELECT * FROM motivo_consulta WHERE id_historia = $1`;
      const { rows } = await pool.query(query, [id_historia]);
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch {
      // console.error('Error al obtener motivo de consulta por historia');
      return null;
    }
  }

  static async update(id_historia, { motivo }) {
    try {
      const query = `CALL u_motivo_consulta($1, $2)`;
      const values = [id_historia, motivo];
      await pool.query(query, values);
      return true;
    } catch (error) {
      // console.error('Error al actualizar motivo de consulta');
      throw new Error(
        error.message || 'Error al actualizar motivo de consulta'
      );
    }
  }
}

export default MotivoConsulta;
