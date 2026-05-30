import {
  DomainError,
  EvolucionAggregate,
} from '../../evolucion/domain/evolucionDomain.js';

/**
 * Testing API: adaptador primario sustituto para el módulo de evolución.
 * Instancia EvolucionAggregate directamente sin pasar por Express ni BD.
 */
export default class EvolucionTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async registrarEvolucion(input) {
    const { idHistory, fecha, actividad, alumno, idUsuario } = input;
    const agregado = new EvolucionAggregate({
      idHistory: idHistory || undefined,
      fecha: fecha || null,
      actividad: actividad || null,
      alumno: alumno || null,
      idUsuario: idUsuario || undefined,
    });
    await this.repository.save(agregado.obtenerParametros());
    return {
      success: true,
      message: 'Evolución registrada correctamente',
      params: agregado.obtenerParametros(),
    };
  }
}

export { DomainError };
