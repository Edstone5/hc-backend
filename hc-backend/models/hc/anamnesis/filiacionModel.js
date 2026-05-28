import pool from '../../../db/db.js';

const Filiacion = {
  async create(data) {
    const query = `CALL i_filiacion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`;
    const values = [
      data.id_historia,
      data.raza || null,
      data.fecha_nacimiento || null,
      data.lugar || null,
      data.estado_civil || null,
      data.nombre_conyuge || null,
      data.ocupacion || null,
      data.lugar_procedencia || null,
      data.tiempo_residencia_tacna || null,
      data.direccion || null,
      data.ultima_visita_dentista || null,
      data.motivo_visita_dentista || null,
      data.ultima_visita_medico || null,
      data.motivo_visita_medico || null,
      data.contacto_emergencia || null,
      data.telefono_emergencia || null,
      data.acompaniante || null,
      data.edad || null,
      data.sexo || null,
      data.fecha_elaboracion || null,
    ];
    await pool.query(query, values);
    return { success: true, id_historia: data.id_historia };
  },

  async getById(id_filiacion) {
    const query = `SELECT * FROM filiacion WHERE id_filiacion = $1`;
    const { rows } = await pool.query(query, [id_filiacion]);
    return rows[0];
  },

  async getByHistoria(id_historia) {
    const query = `SELECT * FROM filiacion WHERE id_historia = $1`;
    const { rows } = await pool.query(query, [id_historia]);
    return rows[0];
  },

  async update(id_historia, data) {
    const query = `CALL u_filiacion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`;
    const values = [
      id_historia,
      data.raza || null,
      data.fecha_nacimiento || null,
      data.lugar || null,
      data.estado_civil || null,
      data.nombre_conyuge || null,
      data.ocupacion || null,
      data.lugar_procedencia || null,
      data.tiempo_residencia_tacna || null,
      data.direccion || null,
      data.ultima_visita_dentista || null,
      data.motivo_visita_dentista || null,
      data.ultima_visita_medico || null,
      data.motivo_visita_medico || null,
      data.contacto_emergencia || null,
      data.telefono_emergencia || null,
      data.acompaniante || null,
      data.edad || null,
      data.sexo || null,
      data.fecha_elaboracion || null,
    ];
    await pool.query(query, values);
    return { success: true, id_historia };
  },
};

export default Filiacion;
