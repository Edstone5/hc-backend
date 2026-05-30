import { IMotivoConsultaRepository } from '../domain/motivoConsultaDomain.js';
import pool from '../../db/db.js';

export class MotivoConsultaRepository extends IMotivoConsultaRepository {
  async create(agregado) {
    const [idHistoria, motivo] = agregado.obtenerParametros();
    await pool.query(
      'INSERT INTO motivo_consulta (id_historia, motivo) VALUES ($1, $2)',
      [idHistoria, motivo]
    );
    return true;
  }

  async getByHistoria(id_historia) {
    const { rows } = await pool.query(
      'SELECT * FROM motivo_consulta WHERE id_historia = $1',
      [id_historia]
    );
    return rows[0];
  }

  async update(agregado) {
    await pool.query(
      'UPDATE motivo_consulta SET motivo = $1 WHERE id_historia = $2',
      [agregado.motivo, agregado.idHistoria]
    );
    return true;
  }
}

const motivoConsultaRepository = new MotivoConsultaRepository();
export default motivoConsultaRepository;
