import express from 'express';
import {
  getCatalogoController,
  getCatalogoNombrePorIdController,
} from '../controllers/catologo/catalogoControllers.js';

const router = express.Router();

// GET /api/catalogo/:nombre
router.get('/:nombre', getCatalogoController);

// GET /api/catalogo/:nombre/:id
router.get('/:nombre/:id', getCatalogoNombrePorIdController);

export default router;
