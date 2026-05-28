import {
  EnfermedadActualAggregate,
  DomainError,
} from '../../enfermedadActual/domain/enfermedadActualDomain.js';

/**
 * Testing API: adaptador primario sustituto que invoca directamente la lógica de dominio.
 * Recibe un repositorio (stub) in-memory inyectado desde los step definitions.
 */
export default class EnfermedadActualTestingAPI {
  /**
   * @param {{ create: Function, getByHistoria: Function, update: Function }} repository
   */
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Registra un agregado de enfermedad actual en el repositorio in-memory.
   * @param {Object} input Datos planos compatibles con el constructor de EnfermedadActualAggregate.
   */
  async registerEnfermedadActual(input) {
    try {
      const agregado = new EnfermedadActualAggregate(input);
      await this.repository.create(agregado);
      return {
        success: true,
        message: 'Enfermedad actual registrada con exito',
        id: agregado.idHistoria,
      };
    } catch (err) {
      if (err instanceof DomainError) {
        throw err;
      }
      throw err;
    }
  }

  /**
   * Actualiza una enfermedad actual existente.
   * Retorna un objeto con status 404 cuando el registro no existe.
   * @param {Object} input
   */
  async updateEnfermedadActual(input) {
    try {
      const agregado = new EnfermedadActualAggregate(input);
      const existente = await this.repository.getByHistoria(
        agregado.idHistoria
      );
      if (!existente) {
        return {
          success: false,
          status: 404,
          message:
            'No se encontro enfermedad actual para la historia clinica indicada',
        };
      }
      await this.repository.update(agregado);
      return {
        success: true,
        message: 'Enfermedad actual actualizada correctamente',
        id: agregado.idHistoria,
      };
    } catch (err) {
      if (err instanceof DomainError) {
        throw err;
      }
      throw err;
    }
  }

  /**
   * Obtiene la representación persistida (simulada) de una enfermedad actual.
   * @param {string} id_historia
   */
  async getEnfermedadActual(id_historia) {
    return this.repository.getByHistoria(id_historia);
  }
}
