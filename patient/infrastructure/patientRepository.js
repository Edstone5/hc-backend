/**
 * Adaptador Secundario: PatientRepository
 * Usa `pool.query` para realizar operaciones en la base de datos.
 * Implementa {@link IPatientRepository}.
 */
import { randomUUID } from 'crypto';
import { IPatientRepository } from '../domain/patientDomain.js';
import pool from '../../db/db.js';

class PatientRepository extends IPatientRepository {
  async crearPaciente(aggregate) {
    const [nombre, apellido, dni, fechaNac, sexo, telefono, email] =
      aggregate.obtenerParametrosParaCrear();
    const id = randomUUID();
    await pool.query(
      `INSERT INTO paciente (id_paciente, nombre, apellido, dni, fecha_nacimiento, sexo, telefono, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, nombre, apellido, dni, fechaNac, sexo, telefono, email]
    );
    return { id };
  }

  async actualizarPaciente(id, aggregate) {
    const params = aggregate.obtenerParametrosParaActualizar();
    await pool.query(
      `UPDATE paciente
       SET nombre   = COALESCE($1, nombre),
           apellido = COALESCE($2, apellido),
           telefono = COALESCE($3, telefono),
           email    = COALESCE($4, email)
       WHERE id_paciente = $5`,
      [
        params[0] || null,
        params[1] || null,
        params[2] || null,
        params[3] || null,
        id,
      ]
    );
    return true;
  }
}

export { PatientRepository };
