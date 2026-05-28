import {
  HigieneBocalAggregate,
  DomainError,
} from '../../higieneBocal/domain/higieneBocalDomain.js';

/**
 * Testing API: adaptador primario sustituto que invoca directamente la lógica de dominio.
 * Recibe un repositorio in-memory inyectado desde los step definitions.
 *
 * HigieneBocalAggregate espera { idHistory, body: {}, idUsuario }.
 * Los métodos reciben entrada plana con campos id_historia / estado_higiene / id_usuario.
 */
export default class HigieneBocalTestingAPI {
  /**
   * @param {{ consultarPorHistoria: Function, actualizarHigieneBocal: Function }} repository
   */
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Actualiza la higiene bucal en el repositorio in-memory.
   * @param {Object} input { id_historia, estado_higiene, id_usuario, ... }
   */
  async updateHigieneBocal(input) {
    try {
      const { id_historia, id_usuario, ...body } = input;
      const agregado = new HigieneBocalAggregate({
        idHistory: id_historia,
        body,
        idUsuario: id_usuario,
      });
      await this.repository.actualizarHigieneBocal(agregado);
      // idHistory normalizado queda en params[0]
      return {
        success: true,
        message: 'Higiene bucal guardada correctamente',
        id: agregado.obtenerParametros()[0],
      };
    } catch (err) {
      if (err instanceof DomainError) {
        throw err;
      }
      throw err;
    }
  }

  /**
   * Consulta la higiene bucal almacenada.
   * @param {string} id_historia
   */
  async getHigieneBocal(id_historia) {
    return this.repository.consultarPorHistoria(id_historia);
  }
}
