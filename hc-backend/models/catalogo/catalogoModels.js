import pool from '../../db/db.js';

const allowedCatalogs = [
  'catalogo_estado_civil',
  'catalogo_grado_instruccion',
  'catalogo_ocupacion',
  'catalogo_grupo_sanguineo',
  'catalogo_sexo',
  'catalogo_enfermedad',
  'catalogo_habito',
  'catalogo_examen_auxiliar',
  'catalogo_clinica',
  'catalogo_estado_revision',
  'catalogo_posicion',
  'catalogo_medida_regional',
  'catalogo_atm_trayectoria',
  'catalogo_dolor_grado',
  'catalogo_movimiento_mandibular',
];

export async function getCatalogo(nombre) {
  if (!allowedCatalogs.includes(nombre)) {
    throw new Error('Catalog not allowed');
  }
  const result = await pool.query(`SELECT * FROM ${nombre}`);
  return result.rows;
}

// Obtener el registro por id y devolver el nombre
export async function getCatalogoNombrePorId(nombre, id) {
  if (!allowedCatalogs.includes(nombre)) {
    throw new Error('Catalog not allowed');
  }
  const result = await pool.query(
    `SELECT * FROM ${nombre} WHERE id_grupo_sanguineo = $1`,
    [id]
  );
  if (!result.rows.length) {
    return null;
  }
  // Se asume que el campo puede ser 'nombre' o 'descripcion'
  const row = result.rows[0];
  return row.nombre || row.descripcion || null;
}

export default getCatalogo;
