import {
  DomainError,
  UserCodeValueObject,
  PasswordValueObject,
  AuthAggregate,
} from '../../auth/domain/authDomain.js';

/**
 * Testing API: adaptador para el módulo de autenticación.
 * Valida el formato de las credenciales a través del dominio.
 */
export default class AuthTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async autenticar({ userCode, password } = {}) {
    const userCodeVO = new UserCodeValueObject(userCode);
    const passwordVO = new PasswordValueObject(password);
    const agregado = new AuthAggregate({ userCodeVO, passwordVO });
    const params = agregado.obtenerParametros();
    await this.repository.save({ userCode: params[0] });
    return {
      success: true,
      message: 'Credenciales validadas correctamente',
      userCode: params[0],
    };
  }
}

export { DomainError };
