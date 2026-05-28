import pool from '../../../db/db.js';

const EnfermedadActual = {
  create: async (payload) => {
    try {
      await pool.query('CALL i_enfermedad_actual($1)', [payload.id_historia]);
      return { success: true, id_historia: payload.id_historia };
    } catch (err) {
      return null;
    }
  },
  getByHistoria: async (idHistoria) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM enfermedad_actual WHERE id_historia = $1',
        [idHistoria]
      );
      return rows[0] ?? null;
    } catch (err) {
      return null;
    }
  },
  update: async (idHistoria, payload) => {
    try {
      await pool.query('CALL u_enfermedad_actual($1)', [idHistoria]);
      return { success: true, id_historia: idHistoria };
    } catch (err) {
      return null;
    }
  },
};

export default EnfermedadActual;
