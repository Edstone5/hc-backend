import {
  DomainError,
  UserCodeValueObject,
  EmailValueObject,
  UserAggregate,
} from '../../user/domain/userDomain.js';

/**
 * Testing API: adaptador para el módulo de usuarios.
 */
export default class UserTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async registrarUsuario(input) {
    const { userCode, firstName, lastName, dni, email, role, hashedPassword } =
      input;
    const userCodeVO = new UserCodeValueObject(userCode);
    const emailVO = new EmailValueObject(email);
    const agregado = new UserAggregate({
      userCodeVO,
      firstName: firstName || null,
      lastName: lastName || null,
      dni: dni || null,
      emailVO,
      role: role || null,
      hashedPassword: hashedPassword || null,
    });
    await this.repository.save(agregado.obtenerParametros());
    return {
      success: true,
      message: 'Usuario registrado correctamente',
      params: agregado.obtenerParametros(),
    };
  }
}

export { DomainError };
