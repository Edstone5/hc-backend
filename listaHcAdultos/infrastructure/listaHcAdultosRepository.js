import { IListaHcAdultosRepository } from '../domain/listaHcAdultosDomain.js';
import pool from '../../db/db.js';

class ListaHcAdultosRepository extends IListaHcAdultosRepository {
  async listarPorEstudiante(aggregate) {
    const [idEstudiante] = aggregate.obtenerParametros();
    const ageCond =
      pool.dialect === 'mysql'
        ? 'AND (p.fecha_nacimiento IS NULL OR TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) >= 18)'
        : `AND (p.fecha_nacimiento IS NULL OR DATE_PART('year', AGE(p.fecha_nacimiento)) >= 18)`;
    const ageExpr =
      pool.dialect === 'mysql'
        ? 'TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE())'
        : `DATE_PART('year', AGE(p.fecha_nacimiento))`;

    const { rows } = await pool.query(
      `SELECT
         h.id_historia, h.estado, h.fecha_elaboracion AS created_at,
         p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
         p.dni AS paciente_dni, p.fecha_nacimiento,
         ${ageExpr} AS edad
       FROM historia_clinica h
       LEFT JOIN paciente p ON p.id_paciente = h.id_paciente
       WHERE h.id_estudiante = $1
         ${ageCond}
       ORDER BY h.fecha_elaboracion DESC`,
      [idEstudiante]
    );
    return rows || [];
  }
}

export { ListaHcAdultosRepository };
