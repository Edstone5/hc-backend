import pool from '../../../db/db.js';

export const getAdultHistoriasByStudent = async (studentId) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM historias WHERE student_id = $1',
      [studentId]
    );
    return rows;
  } catch (err) {
    return [];
  }
};

export default { getAdultHistoriasByStudent };
