import pool from '../../db/db.js';

const rowFirst = (res) => (res && res.rows && res.rows[0] ? res.rows[0] : null);

const mapKeys = (obj = {}) => {
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const overrides = {
      labios_sin_lesiones: 'labiosSin',
    };
    const camel =
      overrides[k] || k.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase());
    out[camel] = v;
  }
  return out;
};

export const HcModel = {
  createReview: async (payload) => {
    try {
      await pool.query('CALL create_review($1,$2,$3,$4)', [
        payload.idHistory,
        payload.idTeacher,
        payload.state,
        payload.observations,
      ]);
      return true;
    } catch (err) {
      return null;
    }
  },
  getFiliationByIdHistory: async (id) => {
    try {
      const res = await pool.query(
        'SELECT * FROM filiacion WHERE id_historia = $1',
        [id]
      );
      return rowFirst(res);
    } catch (err) {
      return null;
    }
  },
  registerHc: async (idStudent) => {
    try {
      const res = await pool.query(
        'INSERT INTO historias(student_id) VALUES($1) RETURNING id_historia',
        [idStudent]
      );
      return rowFirst(res);
    } catch (err) {
      return null;
    }
  },
  getAllByStudentId: async (studentId) => {
    const res = await pool.query(
      'SELECT * FROM historias WHERE student_id = $1',
      [studentId]
    );
    return res.rows || [];
  },
  createDraft: async (studentId) => {
    const res = await pool.query(
      'INSERT INTO historias_draft(student_id) VALUES($1) RETURNING id_historia',
      [studentId]
    );
    return rowFirst(res);
  },
  assignPatient: async (idHistory, idPatient) => {
    await pool.query(
      'UPDATE historias SET patient_id = $1 WHERE id_historia = $2',
      [idPatient, idHistory]
    );
  },
  getPatientByHistory: async (idHistory) => {
    const res = await pool.query(
      'SELECT * FROM pacientes WHERE id_historia = $1',
      [idHistory]
    );
    return rowFirst(res);
  },
  updateFiliation: async (payload) => {
    try {
      await pool.query(
        'UPDATE filiacion SET nombre = $1 WHERE id_historia = $2',
        [payload.nombre, payload.idHistory]
      );
      return true;
    } catch (err) {
      throw err;
    }
  },
  getGeneralExam: async (id) => {
    const res = await pool.query(
      'SELECT * FROM examen_general WHERE id_historia = $1',
      [id]
    );
    return rowFirst(res);
  },
  updateGeneralExam: async (payload) => {
    await pool.query('CALL update_examen_general($1)', [payload.idHistory]);
    return true;
  },
  getRegionalExam: async (id) => {
    const res = await pool.query(
      'SELECT * FROM examen_regional WHERE id_historia = $1',
      [id]
    );
    return res.rows[0] ? mapKeys(res.rows[0]) : null;
  },
  updateRegionalExam: async (payload) => {
    await pool.query('CALL update_examen_regional($1)', [payload.idHistory]);
    return true;
  },
  getExamBoca: async (id) => {
    const res = await pool.query(
      'SELECT * FROM examen_boca WHERE id_historia = $1',
      [id]
    );
    if (!res.rows[0]) {
      return null;
    }
    return mapKeys(res.rows[0]);
  },
  updateExamBoca: async (payload) => {
    await pool.query('CALL update_examen_boca($1)', [payload.idHistory]);
    return true;
  },
  getHigieneOral: async (id) => {
    const res = await pool.query(
      'SELECT * FROM higiene_oral WHERE id_historia = $1',
      [id]
    );
    return res.rows[0] ? mapKeys(res.rows[0]) : null;
  },
  updateHigieneOral: async (payload) => {
    await pool.query('CALL update_higiene_oral($1)', [payload.idHistory]);
    return true;
  },
  getDiagnosticoPresuntivo: async (id) => {
    const res = await pool.query(
      'SELECT descripcion FROM diagnostico_presuntivo WHERE id_historia = $1',
      [id]
    );
    if (!res.rows || !res.rows[0]) {
      return { descripcion: '' };
    }
    return res.rows[0];
  },
  updateDiagnosticoPresuntivo: async (payload) => {
    await pool.query('CALL update_diagnostico_presuntivo($1)', [
      payload.idHistory,
    ]);
    return true;
  },
  getDerivacion: async (id) => {
    const res = await pool.query(
      'SELECT * FROM derivacion WHERE id_historia = $1',
      [id]
    );
    return rowFirst(res);
  },
  updateDerivacion: async (payload) => {
    await pool.query('CALL update_derivacion($1)', [payload.idHistory]);
    return true;
  },
  getDiagnosticoClinicas: async (id) => {
    const res = await pool.query(
      'SELECT fecha, clinica_respuesta FROM diagnostico_clinicas WHERE id_historia = $1',
      [id]
    );
    return rowFirst(res) || {};
  },
  updateDiagnosticoClinicas: async (payload) => {
    await pool.query('CALL update_diagnostico_clinicas($1)', [
      payload.idHistory,
    ]);
    return true;
  },
  getEvolucion: async (id) => {
    const res = await pool.query(
      'SELECT * FROM evolucion WHERE id_historia = $1',
      [id]
    );
    return res.rows;
  },
  addEvolucion: async (payload) => {
    await pool.query('CALL add_evolucion($1)', [payload.idHistory]);
    return true;
  },
};

export default HcModel;
