import { IEnfermedadActualRepository } from '../domain/enfermedadActualDomain.js';
import pool from '../../db/db.js';

export class EnfermedadActualRepository extends IEnfermedadActualRepository {
  async create(agregado) {
    const [
      idHistoria,
      sintomaPrincipal,
      tiempoEnfermedad,
      formaInicio,
      curso,
      relato,
      tratamientoPrev,
    ] = agregado.obtenerParametros();
    await pool.query(
      `INSERT INTO enfermedad_actual (id_historia, sintoma_principal, tiempo_enfermedad, forma_inicio, curso, relato, tratamiento_prev)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        idHistoria,
        sintomaPrincipal,
        tiempoEnfermedad,
        formaInicio,
        curso,
        relato,
        tratamientoPrev,
      ]
    );
    return { success: true, id_historia: idHistoria };
  }

  async getByHistoria(id_historia) {
    const { rows } = await pool.query(
      'SELECT * FROM enfermedad_actual WHERE id_historia = $1',
      [id_historia]
    );
    return rows[0];
  }

  async update(agregado) {
    const [
      idHistoria,
      sintomaPrincipal,
      tiempoEnfermedad,
      formaInicio,
      curso,
      relato,
      tratamientoPrev,
    ] = agregado.obtenerParametros();
    await pool.query(
      `UPDATE enfermedad_actual SET sintoma_principal=$1, tiempo_enfermedad=$2, forma_inicio=$3,
       curso=$4, relato=$5, tratamiento_prev=$6 WHERE id_historia=$7`,
      [
        sintomaPrincipal,
        tiempoEnfermedad,
        formaInicio,
        curso,
        relato,
        tratamientoPrev,
        idHistoria,
      ]
    );
    return { success: true, id_historia: idHistoria };
  }
}

const enfermedadActualRepository = new EnfermedadActualRepository();
export default enfermedadActualRepository;
