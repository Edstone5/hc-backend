/**
 * Dominio: Auth (Autenticación)
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
 * Value Object: Password (no vacío)
 */
class PasswordValueObject {
  constructor(value) {
    if (typeof value !== 'string' || value.length === 0) {
      throw new DomainError('password es requerido');
    }
    this.value = value;
    Object.freeze(this);
  }
}

/**
 * Aggregate Root: AuthAggregate
 * Protege invariantes y expone parámetros posicionales para la capa de infraestructura.
 */
class AuthAggregate {
  constructor({ userCodeVO, passwordVO } = {}) {
    if (!(userCodeVO instanceof UserCodeValueObject)) {
      throw new DomainError('userCodeVO inválido');
    }
    if (!(passwordVO instanceof PasswordValueObject)) {
      throw new DomainError('passwordVO inválido');
    }
    this._userCode = userCodeVO;
    this._password = passwordVO;
    Object.freeze(this);
  }

  /**
   * Parámetros posicionales para la consulta de login (userCode)
   * @returns {Array}
   */
  obtenerParametros() {
    return [this._userCode.value];
  }
}

// ── Puerto de persistencia (Arquitectura Hexagonal) ──────────────────────────

/**
 * Contrato del adaptador secundario de Auth (Autenticación).
 * Todo repositorio concreto debe extender esta clase abstracta.
 * @abstract
 */
export class IAuthRepository {
  /**
   * Obtiene los datos de un usuario por su código de acceso para login.
   * @param {AuthAggregate} _agregado
   * @returns {Promise<Object|null>} Fila cruda del usuario o null si no existe.
   * @abstract
   */
  async obtenerUsuarioPorUserCode(_agregado) {
    throw new Error(
      'IAuthRepository.obtenerUsuarioPorUserCode() no implementado'
    );
  }

  /**
   * Persiste un refresh token emitido (rotación + revocación, ADR-0028).
   * @param {{ jti:string, idUsuario:string, expiraEn:Date|string }} _datos
   * @returns {Promise<void>}
   * @abstract
   */
  async guardarRefreshToken(_datos) {
    throw new Error('IAuthRepository.guardarRefreshToken() no implementado');
  }

  /**
   * Obtiene el registro de un refresh token por su jti (o null si no existe).
   * @param {string} _jti
   * @returns {Promise<Object|null>}
   * @abstract
   */
  async obtenerRefreshToken(_jti) {
    throw new Error('IAuthRepository.obtenerRefreshToken() no implementado');
  }

  /**
   * Marca un refresh token como revocado, opcionalmente enlazando el jti que lo
   * reemplaza (rotación).
   * @param {string} _jti
   * @param {string|null} [_reemplazadoPor]
   * @returns {Promise<void>}
   * @abstract
   */
  async revocarRefreshToken(_jti, _reemplazadoPor) {
    throw new Error('IAuthRepository.revocarRefreshToken() no implementado');
  }

  /**
   * Revoca TODOS los refresh tokens vigentes de un usuario (logout-all o
   * detección de reúso de un token robado).
   * @param {string} _idUsuario
   * @returns {Promise<void>}
   * @abstract
   */
  async revocarTodosRefreshTokensDeUsuario(_idUsuario) {
    throw new Error(
      'IAuthRepository.revocarTodosRefreshTokensDeUsuario() no implementado'
    );
  }
}

export { DomainError, UserCodeValueObject, PasswordValueObject, AuthAggregate };
