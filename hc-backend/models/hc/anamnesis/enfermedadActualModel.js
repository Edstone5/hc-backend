import pool from '../../../db/db.js';

class EnfermedadActual {
  static async create(data) {
    try {
      const query = 'CALL i_enfermedad_actual($1,$2,$3,$4,$5,$6,$7)';
      const values = [
        data.id_historia,
        data.sintoma_principal,
        data.tiempo_enfermedad,
        data.forma_inicio,
        data.curso,
        data.relato,
        data.tratamiento_prev,
      ];
      await pool.query(query, values);
      // Opcional: podrías retornar un mensaje o buscar el registro recién creado si lo necesitas
      return true;
    } catch {
      // console.error('Error al crear enfermedad actual');
      return null;
    }
  }

  static async getByHistoria(id_historia) {
    try {
      const query = 'SELECT * FROM enfermedad_actual WHERE id_historia = $1';
      const values = [id_historia];
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch {
      // console.error('Error al obtener enfermedad actual');
      return null;
    }
  }

  static async update(id_historia, data) {
    try {
      const query = 'CALL u_enfermedad_actual($1,$2,$3,$4,$5,$6,$7)';
      const values = [
        id_historia,
        data.sintoma_principal,
        data.tiempo_enfermedad,
        data.forma_inicio,
        data.curso,
        data.relato,
        data.tratamiento_prev,
      ];
      await pool.query(query, values);
      // Opcional: podrías retornar un mensaje o buscar el registro actualizado si lo necesitas
      return true;
    } catch {
      // console.error('Error al actualizar enfermedad actual');
      return null;
    }
  }
}

export default EnfermedadActual;
