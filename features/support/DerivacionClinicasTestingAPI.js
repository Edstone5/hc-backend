import {
  DomainError,
  DerivacionClinicasAggregate,
} from '../../derivacionClinicas/domain/derivacionClinicasDomain.js';

/**
 * Testing API: adaptador para el módulo de derivación a clínicas.
 */
export default class DerivacionClinicasTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async registrarDerivacion(input) {
    const { idHistory, destinos, observaciones, alumno, docente, idUsuario } =
      input;
    const destinosValue = destinos || null;
    const agregado = new DerivacionClinicasAggregate({
      idHistory: idHistory || undefined,
      destinos: destinosValue,
      observaciones: observaciones || null,
      alumno: alumno || null,
      docente: docente || null,
      idUsuario: idUsuario || undefined,
    });
    await this.repository.save(agregado.obtenerParametros());
    return {
      success: true,
      message: 'Derivación guardada correctamente',
      params: agregado.obtenerParametros(),
    };
  }
}

export { DomainError };
