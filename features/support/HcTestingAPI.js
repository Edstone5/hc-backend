import {
  DomainError,
  RegistroHistoriaClinicaAggregate,
  RevisionHistoriaClinicaAggregate,
  AsignacionPacienteAggregate,
} from '../../hc/domain/hcDomain.js';

/**
 * Testing API: adaptador primario sustituto para el módulo HC.
 * Instancia los aggregates directamente sin pasar por Express ni BD.
 */
export default class HcTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async registrarHC(input) {
    const { idStudent } = input;
    const agregado = new RegistroHistoriaClinicaAggregate({ idStudent });
    await this.repository.save('registro', agregado.obtenerParametros());
    return {
      success: true,
      message: 'Historia clínica registrada correctamente',
      params: agregado.obtenerParametros(),
    };
  }

  async revisarHC(input) {
    const { idHistory, idTeacher, state, observations } = input;
    const agregado = new RevisionHistoriaClinicaAggregate({
      idHistory,
      idTeacher,
      state,
      observations,
    });
    await this.repository.save('revision', agregado.obtenerParametros());
    return {
      success: true,
      message: 'Revisión guardada correctamente',
      params: agregado.obtenerParametros(),
    };
  }

  async asignarPaciente(input) {
    const { idHistory, idPatient } = input;
    const agregado = new AsignacionPacienteAggregate({ idHistory, idPatient });
    await this.repository.save('asignacion', agregado.obtenerParametros());
    return {
      success: true,
      message: 'Paciente asignado correctamente',
      params: agregado.obtenerParametros(),
    };
  }
}

export { DomainError };
