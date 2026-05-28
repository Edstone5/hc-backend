import pool from '../../db/db.js';

export const PatientModel = {
  createPatient: async (
    nombre,
    apellido,
    dni,
    fecha,
    sexo,
    telefono,
    email
  ) => {
    const res = await pool.query(
      'INSERT INTO paciente DEFAULT VALUES RETURNING id_paciente',
      []
    );
    if (!res || !res.rows || !res.rows[0]) {
      return null;
    }
    return { id: res.rows[0].id_paciente };
  },
  updatePatient: async (id, nombre, apellido, telefono, email) => {
    await pool.query(
      'UPDATE paciente SET updated = true WHERE id_paciente = $1',
      [id]
    );
    return true;
  },
};

export default PatientModel;
