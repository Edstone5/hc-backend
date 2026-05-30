import {
  DomainError,
  DiagnosticoClinicasAggregate,
} from '../../diagnosticoClinicas/domain/diagnosticoClinicasDomain.js';

/**
 * Testing API: adaptador para el módulo de diagnóstico de clínicas.
 */
export default class DiagnosticoClinicasTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async registrarDiagnostico(input) {
    const {
      idHistory,
      idUsuario,
      clinicaRespuesta,
      descripcionRespuesta,
      fechaRespuesta,
      diagnosticoDefinitivo,
      tratamiento,
      pronostico,
      alumnoTratante,
      interconsultaTipo,
      interconsultaFecha,
      interconsultaClinica,
      examenes,
    } = input;

    const agregado = new DiagnosticoClinicasAggregate({
      idHistory: idHistory || undefined,
      idUsuario: idUsuario || undefined,
      data: {
        clinicaRespuesta: clinicaRespuesta || null,
        descripcionRespuesta: descripcionRespuesta || null,
        fechaRespuesta: fechaRespuesta || null,
        diagnosticoDefinitivo: diagnosticoDefinitivo || null,
        tratamiento: tratamiento || null,
        pronostico: pronostico || null,
        alumnoTratante: alumnoTratante || null,
        interconsultaTipo: interconsultaTipo || null,
        interconsultaFecha: interconsultaFecha || null,
        interconsultaClinica: interconsultaClinica || null,
        examenes: examenes || null,
      },
    });
    await this.repository.save(agregado.obtenerParametros());
    return {
      success: true,
      message: 'Diagnóstico clínico guardado correctamente',
      params: agregado.obtenerParametros(),
    };
  }
}

export { DomainError };
