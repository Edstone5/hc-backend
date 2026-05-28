import pool from '../../db/db.js';

export class PatientModel {
  /**
   * Crear un nuevo paciente usando la función fn_crear_paciente
   * @returns {Object} { id: UUID del paciente creado }
   */
  static async createPatient(
    nombre,
    apellido,
    dni,
    fechaNacimiento,
    sexo,
    telefono,
    email
  ) {
    try {
      const result = await pool.query(
        'SELECT fn_crear_paciente($1, $2, $3, $4, $5, $6, $7) AS id_paciente',
        [
          nombre,
          apellido,
          dni || null,
          fechaNacimiento || null,
          sexo || null,
          telefono || null,
          email || null,
        ]
      );

      const idPaciente = result.rows[0].id_paciente;

      return {
        id: idPaciente,
      };
    } catch (error) {
      // console.error('Error al crear paciente');
      throw new Error(error.message || 'Error al crear paciente');
    }
  }

  static async updatePatient(id, nombre, apellido, telefono, email) {
    try {
      await pool.query('CALL u_paciente($1, $2, $3, $4, $5, $6)', [
        id,
        nombre || null, // Si viene undefined, mandamos null
        apellido || null,
        telefono || null,
        email || null,
        null, // activo: null para que no lo modifique el procedure
      ]);

      return true;
    } catch (error) {
      // console.error('Error al actualizar paciente');
      throw new Error(error.message || 'Error al actualizar paciente');
    }
  }
}
