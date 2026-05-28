import pool from '../../db/db.js';

export const StudentModel = {
  getAdultPatientsByStudentId: async (studentId) => {
    const res = await pool.query(
      'SELECT * FROM pacientes_adultos WHERE student_id = $1',
      [studentId]
    );
    return res.rows;
  },
  registerPatient: async (studentId, payload) => {
    const res = await pool.query(
      'INSERT INTO pacientes (student_id, nombre_completo, edad) VALUES($1,$2,$3) RETURNING id',
      [studentId, payload.nombreCompleto, payload.edad]
    );
    return res.rows[0];
  },
};

export default StudentModel;
