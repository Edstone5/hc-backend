import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mockear el módulo. La factory crea la función mock.
vi.mock('../db/db.js', () => ({
  default: {
    query: vi.fn(),
  },
}));

// 2. Importar el módulo a testear.
import * as catalogoModel from '../models/catalogo/catalogoModels.js';
// 3. Importar el módulo mockeado para obtener la referencia al mock.
import pool from '../db/db.js';

const queryMock = pool.query;

describe('Catalogo Model', () => {
  beforeEach(() => {
    // 4. Usar la referencia al mock.
    queryMock.mockReset();
  });

  describe('getCatalogo', () => {
    // ... (el resto del archivo no cambia)
    it('should throw error if catalog not allowed', async () => {
      await expect(catalogoModel.getCatalogo('no_catalog')).rejects.toThrow(
        'Catalog not allowed'
      );
    });

    it('should return rows from db', async () => {
      queryMock.mockResolvedValue({ rows: [{ id: 1, nombre: 'test' }] });

      const result = await catalogoModel.getCatalogo('catalogo_estado_civil');

      expect(result).toEqual([{ id: 1, nombre: 'test' }]);
      expect(queryMock).toHaveBeenCalledWith(
        'SELECT * FROM catalogo_estado_civil'
      );
    });
  });

  describe('getCatalogoNombrePorId', () => {
    it('should throw error if catalog not allowed', async () => {
      await expect(
        catalogoModel.getCatalogoNombrePorId('no_catalog', 1)
      ).rejects.toThrow('Catalog not allowed');
    });

    it('should return null if no rows', async () => {
      queryMock.mockResolvedValue({ rows: [] });

      const result = await catalogoModel.getCatalogoNombrePorId(
        'catalogo_grupo_sanguineo',
        1
      );

      expect(result).toBeNull();
    });

    it('should return nombre if present', async () => {
      queryMock.mockResolvedValue({ rows: [{ nombre: 'A+' }] });

      const result = await catalogoModel.getCatalogoNombrePorId(
        'catalogo_grupo_sanguineo',
        1
      );

      expect(result).toBe('A+');
    });

    it('should return descripcion if nombre not present', async () => {
      queryMock.mockResolvedValue({ rows: [{ descripcion: 'desc' }] });

      const result = await catalogoModel.getCatalogoNombrePorId(
        'catalogo_grupo_sanguineo',
        1
      );

      expect(result).toBe('desc');
    });

    it('should return null if neither nombre nor descripcion', async () => {
      queryMock.mockResolvedValue({ rows: [{}] });

      const result = await catalogoModel.getCatalogoNombrePorId(
        'catalogo_grupo_sanguineo',
        1
      );

      expect(result).toBeNull();
    });

    it('should call pool.query with correct SQL and params', async () => {
      queryMock.mockResolvedValue({ rows: [{ nombre: 'A+' }] });

      await catalogoModel.getCatalogoNombrePorId('catalogo_grupo_sanguineo', 5);

      expect(queryMock).toHaveBeenCalledWith(
        'SELECT * FROM catalogo_grupo_sanguineo WHERE id_grupo_sanguineo = $1',
        [5]
      );
    });
  });
});
