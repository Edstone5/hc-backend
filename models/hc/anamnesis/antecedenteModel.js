import pool from '../../../db/db.js';

const handleError = (err, fallbackMessage) => {
  if (err && err.message) {
    throw new Error(err.message);
  }
  throw new Error(fallbackMessage);
};

export const AntecedentePersonal = {
  create: async (payload) => {
    try {
      await pool.query('CALL i_antecedente_personal($1)', [
        payload.id_historia,
      ]);
      return true;
    } catch (err) {
      handleError(err, 'Error al crear antecedente personal');
    }
  },
  getById: async (id) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM antecedente_personal WHERE id_antecedente = $1',
        [id]
      );
      return rows[0] ?? null;
    } catch (err) {
      handleError(err, 'Error al obtener antecedente personal');
    }
  },
  getByHistoria: async (idHistoria) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM antecedente_personal WHERE id_historia = $1',
        [idHistoria]
      );
      return rows[0] ?? null;
    } catch (err) {
      handleError(err, 'Error al obtener antecedente personal');
    }
  },
  update: async (id, payload) => {
    try {
      await pool.query('CALL u_antecedente_personal($1)', [id]);
      return true;
    } catch (err) {
      if (err && err.message) {
        throw new Error(err.message);
      }
      throw new Error('Error al actualizar antecedente personal');
    }
  },
};

export const AntecedenteMedico = {
  create: async (payload) => {
    try {
      await pool.query('CALL i_antecedente_medico($1)', [payload.id_historia]);
      return true;
    } catch (err) {
      handleError(err, 'Error al crear antecedente medico');
    }
  },
  getByHistoria: async (idHistoria) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM antecedente_medico WHERE id_historia = $1',
        [idHistoria]
      );
      return rows[0] ?? null;
    } catch (err) {
      handleError(err, 'Error al obtener antecedente medico');
    }
  },
  update: async (id, payload) => {
    try {
      await pool.query('CALL u_antecedente_medico($1)', [id]);
      return true;
    } catch (err) {
      handleError(err, 'Error al actualizar antecedente medico');
    }
  },
};

export const AntecedenteFamiliar = {
  create: async (payload) => {
    try {
      await pool.query('CALL i_antecedente_familiar($1)', [
        payload.id_historia,
      ]);
      return true;
    } catch (err) {
      handleError(err, 'Error al crear antecedente familiar');
    }
  },
  getByHistoria: async (idHistoria) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM antecedente_familiar WHERE id_historia = $1',
        [idHistoria]
      );
      return rows[0] ?? null;
    } catch (err) {
      handleError(err, 'Error al obtener antecedente familiar');
    }
  },
  update: async (id, payload) => {
    try {
      await pool.query('CALL u_antecedente_familiar($1)', [id]);
      return true;
    } catch (err) {
      handleError(err, 'Error al actualizar antecedente familiar');
    }
  },
};

export const AntecedenteCumplimiento = {
  create: async (payload) => {
    try {
      await pool.query('CALL i_antecedente_cumplimiento($1)', [
        payload.id_historia,
      ]);
      return true;
    } catch (err) {
      handleError(err, 'Error al crear antecedente cumplimiento');
    }
  },
  getByHistoria: async (idHistoria) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM antecedente_cumplimiento WHERE id_historia = $1',
        [idHistoria]
      );
      return rows[0] ?? null;
    } catch (err) {
      handleError(err, 'Error al obtener antecedente cumplimiento');
    }
  },
  update: async (id, payload) => {
    try {
      await pool.query('CALL u_antecedente_cumplimiento($1)', [id]);
      return true;
    } catch (err) {
      handleError(err, 'Error al actualizar antecedente cumplimiento');
    }
  },
};

export default {
  AntecedenteCumplimiento,
  AntecedenteFamiliar,
  AntecedentePersonal,
  AntecedenteMedico,
};
