import {
  DomainError,
  RoleValueObject,
  StudentUsersAggregate,
} from '../../studentUsers/domain/studentUsersDomain.js';

/**
 * Testing API: adaptador para el módulo de usuarios estudiantes.
 */
export default class StudentUsersTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async consultarPorRol({ role } = {}) {
    const roleVO = new RoleValueObject(role);
    const agregado = new StudentUsersAggregate({ roleVO });
    const params = agregado.obtenerParametros();
    const result = await this.repository.getByRole(params[0]);
    return {
      success: true,
      message: 'Usuarios estudiantes consultados correctamente',
      role: params[0],
      data: result,
    };
  }
}

export { DomainError };
