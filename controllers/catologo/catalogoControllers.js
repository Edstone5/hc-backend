import * as catalogoModel from '../../models/catalogo/catalogoModels.js';

export const getCatalogoController = async (req, res) => {
  try {
    const nombre = req.params.nombre;
    const data = await catalogoModel.getCatalogo(nombre);
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found for this catalog' });
    }
    return res
      .status(200)
      .json({ message: 'Catalog data retrieved successfully', data });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const getCatalogoNombrePorIdController = async (req, res) => {
  try {
    const nombre = req.params.nombre;
    const id = req.params.id;
    const value = await catalogoModel.getCatalogoNombrePorId(nombre, id);
    if (value === null) {
      return res
        .status(404)
        .json({ error: 'No data found for this id in catalog' });
    }
    return res.status(200).json({
      message: 'Catalog name retrieved successfully',
      id,
      nombre: value,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export default {
  getCatalogoController,
  getCatalogoNombrePorIdController,
};
