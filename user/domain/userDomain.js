/**
 * Dominio: User
 * Value Objects, DomainError y Aggregate Root.
 * Sin acceso a BD.
 */

/**
 * Error de dominio para validaciones estrictas.
 * @extends Error
 */
class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainError';
    Object.freeze(this);
  }
}

/**
 * Value Object: UserCode (no vacío)
 */
class UserCodeValueObject {
  constructor(value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new DomainError('userCode es requerido');
    }
    this.value = value.trim();
    Object.freeze(this);
  }
}

/**
 * Value Object: Email (formato básico)
 */
class EmailValueObject {
  constructor(value) {
    if (
      typeof value !== 'string' ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
    ) {
      throw new DomainError('email inválido');
    }
    this.value = value.trim();
    Object.freeze(this);
  }
}

/**
 * Aggregate Root: UserAggregate
 * Protege invariantes y expone parámetros posicionales para la capa de infraestructura.
 */
class UserAggregate {
  constructor({
    userCodeVO,
    firstName,
    lastName,
    dni,
    emailVO,
    role,
    hashedPassword,
  } = {}) {
    if (!(userCodeVO instanceof UserCodeValueObject)) {
      throw new DomainError('userCodeVO inválido');
    }
    if (!(emailVO instanceof EmailValueObject)) {
      throw new DomainError('emailVO inválido');
    }

    this._userCode = userCodeVO;
    this._firstName = firstName;
    this._lastName = lastName;
    this._dni = dni || null;
    this._email = emailVO;
    this._role = role || null;
    this._hashedPassword = hashedPassword || null;
    Object.freeze(this);
  }

  /**
   * Devuelve parámetros posicionales para registrar usuario en la BD.
   * @returns {Array}
   */
  obtenerParametros() {
    return [
      this._userCode.value,
      this._firstName,
      this._lastName,
      this._dni,
      this._email.value,
      this._role,
      this._hashedPassword,
    ];
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Usuario.
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class ActualizarEstadoAggregate {
  constructor({ id, activo } = {}) {
    if (!id || typeof id !== 'string') {
      throw new DomainError('id de usuario requerido');
    }
    if (typeof activo !== 'boolean') {
      throw new DomainError('activo debe ser boolean');
    }
    this.id = id;
    this.activo = activo;
    Object.freeze(this);
  }
}

export class IUserRepository {
  /**
   * Devuelve todos los usuarios registrados en el sistema.
   * @returns {Promise<Array>}
   * @abstract
   */
  async listarUsuarios() {
    throw new Error('IUserRepository.listarUsuarios() no implementado');
  }

  /**
   * Persiste un nuevo usuario.
   * @param {UserAggregate} _agregado
   * @returns {Promise<boolean>}
   * @abstract
   */
  async registrarUsuario(_agregado) {
    throw new Error('IUserRepository.registrarUsuario() no implementado');
  }

  /**
   * Recupera un usuario por su identificador UUID.
   * @param {string} _id
   * @returns {Promise<Object|null>}
   * @abstract
   */
  async obtenerUsuarioPorId(_id) {
    throw new Error('IUserRepository.obtenerUsuarioPorId() no implementado');
  }

  /**
   * Recupera un usuario por su código de acceso (para login).
   * @param {string} _userCode
   * @returns {Promise<Object|null>}
   * @abstract
   */
  async obtenerUsuarioLogin(_userCode) {
    throw new Error('IUserRepository.obtenerUsuarioLogin() no implementado');
  }

  async actualizarEstado(_agregado) {
    throw new Error('IUserRepository.actualizarEstado() no implementado');
  }
}

export { DomainError, UserCodeValueObject, EmailValueObject, UserAggregate };
