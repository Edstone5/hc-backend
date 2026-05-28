import argon2 from 'argon2';
import pool from '../../db/db.js';

export class UserModel {
  static async register(
    userCode,
    firstName,
    lastName,
    dni,
    email,
    role,
    password
  ) {
    try {
      const hashedPassword = await argon2.hash(password);

      await pool.query('CALL i_registrar_usuario($1, $2, $3, $4, $5, $6, $7)', [
        userCode,
        firstName,
        lastName,
        dni,
        email,
        role,
        hashedPassword,
      ]);
      return {
        userCode,
        firstName,
        lastName,
        dni,
        email,
        role,
      };
    } catch {
      // console.error('Error al registrar usuario');
      return null;
    }
  }

  static async getUserById(id) {
    const result = await pool.query('SELECT * FROM fn_obtener_usuario($1)', [
      id,
    ]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }

  static async login(userCode, password) {
    const result = await pool.query(
      'SELECT * FROM fn_obtener_usuario_login($1)',
      [userCode]
    );
    if (result.rows.length === 0) {
      return null;
    }
    const user = result.rows[0];
    const isPasswordValid = await argon2.verify(user.contrasena_hash, password);
    if (!isPasswordValid) {
      // console.log('Invalid password');
      return null;
    }

    // console.log('Sesion iniciada, usuario:', user.nombre);
    return {
      id: user.id_usuario,
      userCode: userCode,
      firstName: user.nombre,
      lastName: user.apellido,
      dni: user.dni,
      email: user.email,
      role: user.rol,
    };
  }
}
