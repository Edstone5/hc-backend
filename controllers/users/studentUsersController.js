import pool from '../../db/db.js';

export const getAllStudentUsers = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM student_users');
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
};

export default { getAllStudentUsers };
