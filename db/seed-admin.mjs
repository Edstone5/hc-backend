/**
 * Script puntual para crear/actualizar un usuario (admin, docente, etc.).
 * Idempotente: si el codigo_usuario ya existe, actualiza rol + contraseña.
 *
 * Uso:  node db/seed-admin.mjs <codigo_usuario> <password> [rol] [nombre] [apellido]
 * Ej.:  node db/seed-admin.mjs 2023-119013 esis123 admin
 *       node db/seed-admin.mjs docente1 esis123 docente Docente Pruebas
 *
 * Usa el pool del proyecto (respeta DATABASE_URL / NeonDB / dialecto).
 */
import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import pool from './db.js';

const codigo = process.argv[2] || '2023-119013';
const password = process.argv[3] || 'esis123';
const rol = process.argv[4] || 'admin';
const nombre =
  process.argv[5] ||
  (rol === 'docente'
    ? 'Docente'
    : rol === 'admin'
      ? 'Administrador'
      : 'Usuario');
const apellido = process.argv[6] || 'Pruebas';

const userCodeCol = pool.dialect === 'mysql' ? 'user_code' : 'codigo_usuario';
const passwordCol = pool.dialect === 'mysql' ? 'password' : 'contrasena_hash';

async function main() {
  const hash = await argon2.hash(password);

  const existente = await pool.query(
    `SELECT id_usuario FROM usuario WHERE ${userCodeCol} = $1 LIMIT 1`,
    [codigo]
  );

  if (existente.rows.length > 0) {
    const id = existente.rows[0].id_usuario;
    await pool.query(
      `UPDATE usuario SET ${passwordCol} = $1, rol = $2, activo = $3 WHERE id_usuario = $4`,
      [hash, rol, true, id]
    );
    console.log(`✔ Usuario actualizado: ${codigo} (rol=${rol}, id=${id})`);
  } else {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO usuario (id_usuario, ${userCodeCol}, nombre, apellido, dni, email, rol, ${passwordCol})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        codigo,
        nombre,
        apellido,
        codigo.replace(/\D/g, '').slice(-8).padStart(8, '0'),
        `${codigo.replace(/[^0-9a-zA-Z]/g, '')}@unjbg.edu.pe`,
        rol,
        hash,
      ]
    );
    console.log(`✔ Usuario creado: ${codigo} (rol=${rol}, id=${id})`);
  }

  // Verificación
  const check = await pool.query(
    `SELECT ${userCodeCol} AS codigo, nombre, rol, activo FROM usuario WHERE ${userCodeCol} = $1`,
    [codigo]
  );
  console.log('   →', JSON.stringify(check.rows[0]));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('✖ Error:', e.message);
    process.exit(1);
  });
