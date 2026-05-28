import pool from '../../../db/db.js';

const MotivoConsulta = {
  create: async (payload) => {
    try {
      await pool.query('CALL i_motivo_consulta($1)', [payload.id_historia]);
      return true;
    } catch (err) {
      if (err && err.message) {
        throw new Error(err.message);
      }
      throw new Error('Error al crear motivo de consulta');
    }
  },
  getById: async (id) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM motivo_consulta WHERE id_motivo = $1',
        [id]
      );
      return rows[0] ?? null;
    } catch (err) {
      return null;
    }
  },
  getByHistoria: async (idHistoria) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM motivo_consulta WHERE id_historia = $1',
        [idHistoria]
      );
      return rows[0] ?? null;
    } catch (err) {
      return null;
    }
  },
  update: async (idHistoria, payload) => {
    try {
      await pool.query('CALL u_motivo_consulta($1)', [idHistoria]);
      return true;
    } catch (err) {
      if (err && err.message) {
        throw new Error(err.message);
      }
      throw new Error('Error al actualizar motivo de consulta');
    }
  },
};

export default MotivoConsulta;
