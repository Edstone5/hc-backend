import {
  DomainError,
  NombreValueObject,
  ApellidoValueObject,
  FechaNacimientoValueObject,
  PatientAggregate,
} from '../../patient/domain/patientDomain.js';

/**
 * Testing API: adaptador para el módulo de pacientes.
 */
export default class PatientTestingAPI {
  constructor(repository) {
    this.repository = repository;
  }

  async registrarPaciente(input) {
    const { nombre, apellido, dni, fechaNacimiento, sexo, telefono, email } =
      input;
    const nombreVO = new NombreValueObject(nombre);
    const apellidoVO = new ApellidoValueObject(apellido);
    const fechaNacimientoVO = new FechaNacimientoValueObject(
      fechaNacimiento || null
    );
    const agregado = new PatientAggregate({
      nombreVO,
      apellidoVO,
      dni: dni || null,
      fechaNacimientoVO,
      sexo: sexo || null,
      telefono: telefono || null,
      email: email || null,
    });
    await this.repository.save(agregado.obtenerParametrosParaCrear());
    return {
      success: true,
      message: 'Paciente registrado correctamente',
      params: agregado.obtenerParametrosParaCrear(),
    };
  }
}

export { DomainError };
