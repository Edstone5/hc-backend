import {
  DomainError,
  DiagnosticoPresuntivoAggregate,
} from '../../diagnosticoPresuntivo/domain/diagnosticoPresuntivoDomain.js';

/**
 * Testing API: adaptador para el módulo de diagnóstico presuntivo.
 */
export default class DiagnosticoPresuntivoTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async actualizarDiagnostico(input) {
    const { idHistory, descripcion, idUsuario } = input;
    const agregado = new DiagnosticoPresuntivoAggregate({
      idHistory: idHistory || undefined,
      descripcion: descripcion || null,
      idUsuario: idUsuario || undefined,
    });
    await this.repository.save(agregado.obtenerParametros());
    return {
      success: true,
      message: 'Diagnóstico presuntivo guardado correctamente',
      params: agregado.obtenerParametros(),
    };
  }
}

export { DomainError };
