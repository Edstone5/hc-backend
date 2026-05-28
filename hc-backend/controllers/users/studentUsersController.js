import pool from '../../db/db.js';

export const getAllStudentUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM usuario WHERE rol = 'estudiante'"
    );
    res.status(200).json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
};
