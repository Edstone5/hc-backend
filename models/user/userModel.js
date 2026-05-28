import argon2 from 'argon2';
import pool from '../../db/db.js';

export const UserModel = {
  register: async (
    userCode,
    firstName,
    lastName,
    dni,
    email,
    role,
    password
  ) => {
    try {
      const hash = await argon2.hash(password);
      await pool.query(
        'INSERT INTO users (user_code, nombre, apellido, dni, email, rol, contrasena_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [userCode, firstName, lastName, dni, email, role, hash]
      );
      return { userCode, firstName, lastName, dni, email, role };
    } catch (err) {
      return null;
    }
  },

  getUserById: async (id) => {
    const res = await pool.query(
      'SELECT * FROM usuarios WHERE id_usuario = $1',
      [id]
    );
    return res.rows[0] ?? null;
  },

  login: async (userCode, password) => {
    const res = await pool.query(
      'SELECT * FROM usuarios WHERE user_code = $1',
      [userCode]
    );
    if (!res.rows || res.rows.length === 0) {
      return null;
    }
    const row = res.rows[0];
    const ok = await argon2.verify(
      row.contrasena_hash || row.contrasenaHash || '',
      password
    );
    if (!ok) {
      return null;
    }
    return {
      id: row.id_usuario || row.id,
      userCode: userCode,
      firstName: row.nombre || row.firstName,
      lastName: row.apellido || row.lastName,
      dni: row.dni,
      email: row.email,
      role: row.rol || row.role,
    };
  },
};

export default UserModel;
