import {
  AntecedentePersonalAggregate,
  AntecedenteMedicoAggregate,
  AntecedenteFamiliarAggregate,
  SeguimientoDelTratamientoAggregate,
  DomainError,
} from '../../antecedente/domain/antecedenteDomain.js';

/**
 * Testing API: adaptador primario sustituto que invoca directamente la lógica de dominio.
 * Recibe un repositorio in-memory inyectado desde los step definitions.
 */
export default class AntecedenteTestingAPI {
  /**
   * @param {object} repository Stub in-memory del AntecedenteRepository real.
   */
  constructor(repository) {
    this.repository = repository;
  }

  async registerAntecedentePersonal(input) {
    try {
      const agregado = new AntecedentePersonalAggregate(input);
      await this.repository.createAntecedentePersonal(agregado);
      return {
        success: true,
        message:
          'Antecedentes personales no patologicos registrados correctamente',
        id: agregado.idHistoria,
      };
    } catch (err) {
      if (err instanceof DomainError) {
        throw err;
      }
      throw err;
    }
  }

  async getAntecedentePersonal(id_historia) {
    return this.repository.getAntecedentePersonalByHistoria(id_historia);
  }

  async registerAntecedenteMedico(input) {
    try {
      const agregado = new AntecedenteMedicoAggregate(input);
      await this.repository.createAntecedenteMedico(agregado);
      return {
        success: true,
        message:
          'Antecedentes personales patologicos registrados correctamente',
        id: agregado.idHistoria,
      };
    } catch (err) {
      if (err instanceof DomainError) {
        throw err;
      }
      throw err;
    }
  }

  async getAntecedenteMedico(id_historia) {
    return this.repository.getAntecedenteMedicoByHistoria(id_historia);
  }

  async registerAntecedenteFamiliar(input) {
    try {
      const agregado = new AntecedenteFamiliarAggregate(input);
      await this.repository.createAntecedenteFamiliar(agregado);
      return {
        success: true,
        message: 'Antecedentes heredo familiares registrados correctamente',
        id: agregado.idHistoria,
      };
    } catch (err) {
      if (err instanceof DomainError) {
        throw err;
      }
      throw err;
    }
  }

  async getAntecedenteFamiliar(id_historia) {
    return this.repository.getAntecedenteFamiliarByHistoria(id_historia);
  }

  async registerSeguimiento(input) {
    try {
      const agregado = new SeguimientoDelTratamientoAggregate(input);
      await this.repository.createAntecedenteCumplimiento(agregado);
      return {
        success: true,
        message: 'Seguimiento del tratamiento registrado correctamente',
        id: agregado.idHistoria,
      };
    } catch (err) {
      if (err instanceof DomainError) {
        throw err;
      }
      throw err;
    }
  }

  async getSeguimiento(id_historia) {
    return this.repository.getAntecedenteCumplimientoByHistoria(id_historia);
  }
}
