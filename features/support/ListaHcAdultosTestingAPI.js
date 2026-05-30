import {
  DomainError,
  IdUuidValueObject,
  ListaHcAdultosAggregate,
} from '../../listaHcAdultos/domain/listaHcAdultosDomain.js';

/**
 * Testing API: adaptador para el módulo de lista de HCs adultos.
 */
export default class ListaHcAdultosTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async consultarHCsAdultos({ idEstudiante } = {}) {
    const idEstudianteVO = new IdUuidValueObject(idEstudiante);
    const agregado = new ListaHcAdultosAggregate({ idEstudianteVO });
    const params = agregado.obtenerParametros();
    const result = await this.repository.getByStudent(params[0]);
    return {
      success: true,
      message: 'Historias clínicas adultas consultadas correctamente',
      idEstudiante: params[0],
      data: result,
    };
  }
}

export { DomainError };
