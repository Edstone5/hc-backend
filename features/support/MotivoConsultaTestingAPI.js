import {
  MotivoConsultaAggregate,
  DomainError,
} from '../../motivoConsulta/domain/motivoConsultaDomain.js';

/**
 * Testing API: adaptador primario sustituto que invoca directamente la lógica de dominio.
 * Recibe un repositorio in-memory inyectado desde los step definitions.
 */
export default class MotivoConsultaTestingAPI {
  /**
   * @param {{ create: Function, getByHistoria: Function, update: Function }} repository
   */
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Registra un motivo de consulta en el repositorio in-memory.
   * @param {Object} input Datos planos compatibles con MotivoConsultaAggregate.
   */
  async registerMotivoConsulta(input) {
    try {
      const agregado = new MotivoConsultaAggregate(input);
      await this.repository.create(agregado);
      return {
        success: true,
        message: 'Motivo de consulta registrado con exito',
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
   * Actualiza un motivo de consulta existente.
   * Retorna status 404 cuando el registro no existe.
   * @param {Object} input
   */
  async updateMotivoConsulta(input) {
    try {
      const agregado = new MotivoConsultaAggregate(input);
      const existente = await this.repository.getByHistoria(
        agregado.idHistoria
      );
      if (!existente) {
        return {
          success: false,
          status: 404,
          message:
            'No se encontro motivo de consulta para la historia clinica indicada',
        };
      }
      await this.repository.update(agregado);
      return {
        success: true,
        message: 'Motivo de consulta actualizado correctamente',
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
   * Consulta el motivo de consulta almacenado.
   * @param {string} id_historia
   */
  async getMotivoConsulta(id_historia) {
    return this.repository.getByHistoria(id_historia);
  }
}
