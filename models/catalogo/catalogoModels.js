import pool from '../../db/db.js';

const allowed = new Set(['catalogo_estado_civil', 'catalogo_grupo_sanguineo']);

export const getCatalogo = async (catalog) => {
  if (!allowed.has(catalog)) {
    throw new Error('Catalog not allowed');
  }
  const { rows } = await pool.query(`SELECT * FROM ${catalog}`);
  return rows;
};

export const getCatalogoNombrePorId = async (catalog, id) => {
  if (!allowed.has(catalog)) {
    throw new Error('Catalog not allowed');
  }
  const idColumn = catalog.replace('catalogo_', 'id_');
  const { rows } = await pool.query(
    `SELECT * FROM ${catalog} WHERE ${idColumn} = $1`,
    [id]
  );
  if (!rows || rows.length === 0) {
    return null;
  }
  const row = rows[0];
  if (row.nombre) {
    return row.nombre;
  }
  if (row.descripcion) {
    return row.descripcion;
  }
  return null;
};

export default {
  getCatalogo,
  getCatalogoNombrePorId,
};
