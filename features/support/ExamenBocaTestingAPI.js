import {
  ExamenBocaAggregate,
  DomainError,
} from '../../examenBoca/domain/examenBocaDomain.js';

/**
 * Testing API: adaptador primario sustituto que invoca directamente la lógica de dominio.
 * Recibe un repositorio in-memory inyectado desde los step definitions.
 *
 * Nota: ExamenBocaAggregate espera { id_historia, body: {} }.
 * No existe operación create en este módulo: solo update y query.
 */
export default class ExamenBocaTestingAPI {
  /**
   * @param {{ getByHistoria: Function, update: Function }} repository
   */
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Actualiza el examen de boca en el repositorio in-memory.
   * @param {Object} input Datos planos: { id_historia, labios_sin_lesiones, ... }
   */
  async updateExamenBoca(input) {
    try {
      const { id_historia, ...body } = input;
      const agregado = new ExamenBocaAggregate({ id_historia, body });
      await this.repository.update(agregado);
      return {
        success: true,
        message: 'Examen de boca guardado correctamente',
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
   * Consulta el examen de boca almacenado.
   * @param {string} id_historia
   */
  async getExamenBoca(id_historia) {
    return this.repository.getByHistoria(id_historia);
  }
}
