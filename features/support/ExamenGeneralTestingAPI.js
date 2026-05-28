import {
  ExamenFisicoGeneralAggregate,
  DomainError,
} from '../../examenGeneral/domain/examenGeneralDomain.js';

/**
 * Testing API: adaptador primario sustituto que invoca directamente la lógica de dominio.
 * Recibe un repositorio in-memory inyectado desde los step definitions.
 *
 * Nota: ExamenFisicoGeneralAggregate espera { id_historia, body: {} }.
 * Los métodos de esta API separan id_historia del resto del input plano.
 */
export default class ExamenGeneralTestingAPI {
  /**
   * @param {{ create: Function, getByHistoria: Function, update: Function }} repository
   */
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Registra un examen físico general en el repositorio in-memory.
   * @param {Object} input Datos planos: { id_historia, temperatura, presion_arterial, peso, ... }
   */
  async registerExamenGeneral(input) {
    try {
      const { id_historia, ...body } = input;
      const agregado = new ExamenFisicoGeneralAggregate({ id_historia, body });
      const data = await this.repository.create(agregado);
      return { success: true, id: agregado.idHistoria, data };
    } catch (err) {
      if (err instanceof DomainError) {
        throw err;
      }
      throw err;
    }
  }

  /**
   * Actualiza un examen físico general existente.
   * @param {Object} input Datos planos: { id_historia, ... }
   */
  async updateExamenGeneral(input) {
    try {
      const { id_historia, ...body } = input;
      const agregado = new ExamenFisicoGeneralAggregate({ id_historia, body });
      await this.repository.update(agregado);
      return { success: true, message: 'Actualizado', id: agregado.idHistoria };
    } catch (err) {
      if (err instanceof DomainError) {
        throw err;
      }
      throw err;
    }
  }

  /**
   * Consulta el examen físico general almacenado.
   * @param {string} id_historia
   */
  async getExamenGeneral(id_historia) {
    return this.repository.getByHistoria(id_historia);
  }
}
