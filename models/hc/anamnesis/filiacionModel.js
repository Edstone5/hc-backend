import pool from '../../../db/db.js';

export default {
  create: async (payload) => {
    await pool.query('CALL i_filiacion($1)', [payload.id_historia]);
    return { success: true, id_historia: payload.id_historia };
  },
  getById: async (id) => {
    const { rows } = await pool.query(
      'SELECT * FROM filiacion WHERE id_filiacion = $1',
      [id]
    );
    return rows[0];
  },
  getByHistoria: async (idHistoria) => {
    const { rows } = await pool.query(
      'SELECT * FROM filiacion WHERE id_historia = $1',
      [idHistoria]
    );
    return rows[0];
  },
  update: async (payload) => {
    await pool.query('CALL u_filiacion($1)', [payload.id_historia]);
    return { success: true, id_historia: payload.id_historia };
  },
};
