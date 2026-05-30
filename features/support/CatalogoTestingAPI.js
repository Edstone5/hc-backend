import {
  DomainError,
  CatalogNameValueObject,
  CatalogoAggregate,
} from '../../catalogo/domain/catalogoDomain.js';

/**
 * Testing API: adaptador para el módulo de catálogos.
 */
export default class CatalogoTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async consultarCatalogo({ catalogName } = {}) {
    const catalogNameVO = new CatalogNameValueObject(catalogName);
    const agregado = new CatalogoAggregate({ catalogNameVO });
    const params = agregado.obtenerParametros();
    const result = await this.repository.getByName(params[0]);
    return {
      success: true,
      message: 'Catálogo consultado correctamente',
      catalogName: params[0],
      data: result,
    };
  }
}

export { DomainError };
