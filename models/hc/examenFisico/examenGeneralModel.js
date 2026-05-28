import pool from '../../../db/db.js';

const safeFirstRow = (res) =>
  res && res.rows && res.rows[0] ? res.rows[0] : null;

const ExamenGeneral = {
  create: async (payload) => {
    try {
      const res = await pool.query(
        'INSERT INTO examen_general DEFAULT VALUES RETURNING *',
        []
      );
      return safeFirstRow(res);
    } catch (err) {
      return null;
    }
  },
  getByHistoria: async (idHistoria) => {
    try {
      const res = await pool.query(
        'SELECT * FROM examen_general WHERE id_historia = $1',
        [idHistoria]
      );
      return safeFirstRow(res);
    } catch (err) {
      return null;
    }
  },
  update: async (id, payload) => {
    try {
      const res = await pool.query(
        'UPDATE examen_general SET updated = true WHERE id_historia = $1 RETURNING *',
        [id]
      );
      return safeFirstRow(res);
    } catch (err) {
      return null;
    }
  },
};

export default ExamenGeneral;
