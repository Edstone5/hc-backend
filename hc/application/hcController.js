/**
 * Adaptador Primario: HcController
 * Construye agregados desde `req`, maneja validaciones y orquesta repositorio.
 */
import { HcRepository } from '../infrastructure/hcRepository.js';
import {
  DomainError,
  RevisionHistoriaClinicaAggregate,
  RegistroHistoriaClinicaAggregate,
  AsignacionPacienteAggregate,
  ConsultaPacienteHistoriaClinicaAggregate,
  ConsultaHistoriasEstudianteAggregate,
} from '../domain/hcDomain.js';

const repo = new HcRepository();

function esErrorDominio(err) {
  return err && (err instanceof DomainError || err.name === 'DomainError');
}

export class HcController {
  constructor() {}

  construirAgregadoRevision(req) {
    const payload = {
      idHistory:
        req.body.idHistory ??
        req.body.id_historia ??
        req.params.id ??
        req.body.id,
      idTeacher: req.body.idTeacher ?? req.user?.id ?? req.body.id_docente,
      state: req.body.state ?? req.body.estado ?? req.body.estadoRevision,
      observations: req.body.observations ?? req.body.observaciones,
    };
    return new RevisionHistoriaClinicaAggregate(payload);
  }

  construirAgregadoRegistro(req) {
    const payload = {
      idStudent: req.body.idStudent ?? req.body.id_estudiante ?? req.user?.id,
    };
    return new RegistroHistoriaClinicaAggregate(payload);
  }

  construirAgregadoAsignacion(req) {
    const payload = {
      idHistory:
        req.body.idHistory ??
        req.body.id_historia ??
        req.body.idHistoria ??
        req.params.id,
      idPatient:
        req.body.idPatient ?? req.body.id_paciente ?? req.body.pacienteId,
    };
    return new AsignacionPacienteAggregate(payload);
  }

  construirAgregadoConsultaPaciente(req) {
    const payload = { id: req.params.id ?? req.query.id ?? req.body.id };
    return new ConsultaPacienteHistoriaClinicaAggregate(payload);
  }

  construirAgregadoConsultaEstudiante(req) {
    const payload = { id: req.params.id ?? req.query.id ?? req.body.id };
    return new ConsultaHistoriasEstudianteAggregate(payload);
  }

  registrarRevisionHistoriaClinica = async (req, res) => {
    try {
      const agregado = this.construirAgregadoRevision(req);
      const ok = await repo.crearRevision(agregado);
      if (ok) {
        return res
          .status(201)
          .json({ message: 'Revision registrada con exito' });
      }
      return res.status(500).json({ error: 'Error al registrar la revision' });
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(500)
        .json({ error: err.message || 'Error del servidor' });
    }
  };

  consultarPacientePorHistoriaClinica = async (req, res) => {
    try {
      const agregado = this.construirAgregadoConsultaPaciente(req);
      const patient = await repo.obtenerPacientePorHistoria(agregado);
      if (!patient) {
        return res.status(404).json({
          error: 'Paciente no encontrado o historia sin paciente asignado',
        });
      }
      return res.status(200).json(patient);
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(500)
        .json({ error: err.message || 'Error al obtener datos del paciente' });
    }
  };

  listarHistoriasClinicasPorEstudiante = async (req, res) => {
    try {
      const agregado = this.construirAgregadoConsultaEstudiante(req);
      const historias = await repo.listarHistoriasPorEstudiante(agregado);
      return res.status(200).json(historias);
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(500)
        .json({ error: err.message || 'Error al obtener historias clínicas' });
    }
  };

  registrarHistoriaClinica = async (req, res) => {
    try {
      const agregado = this.construirAgregadoRegistro(req);
      const hc = await repo.crearHistoriaClinica(agregado);
      if (!hc) {
        return res
          .status(500)
          .json({ error: 'Error al registrar la historia clinica' });
      }
      return res.status(201).json(hc);
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(500)
        .json({ error: err.message || 'Error del servidor' });
    }
  };

  obtenerBorradorHistoriaClinica = async (req, res) => {
    try {
      const agregado = this.construirAgregadoConsultaEstudiante(req);
      const result = await repo.obtenerBorrador(agregado);
      return res.status(200).json({ id_historia: result.id_historia });
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({
        error: err.message || 'Error al crear historia clinica en borrador',
      });
    }
  };

  transferirHistoriaClinica = async (req, res) => {
    try {
      const idHistoria = req.params.id;
      const { idNuevoEstudiante, razon } = req.body;
      if (!idNuevoEstudiante) {
        return res.status(400).json({ error: 'idNuevoEstudiante requerido' });
      }
      if (!razon || !razon.trim()) {
        return res
          .status(400)
          .json({ error: 'razon requerida para la transferencia' });
      }
      await repo.transferirHistoria(idHistoria, idNuevoEstudiante, razon);

      // Notificar a ambos involucrados
      const { crearNotificacion } = await import(
        '../../notificacion/application/notificacionController.js'
      );
      await crearNotificacion({
        idDestinatario: idNuevoEstudiante,
        titulo: 'Historia clínica transferida a ti',
        mensaje: `Se te ha asignado la HC-${idHistoria.slice(0, 8)}. Motivo: ${razon}`,
        tipo: 'transfer',
        idReferencia: idHistoria,
      });

      return res
        .status(200)
        .json({ message: 'Historia clínica transferida correctamente' });
    } catch (err) {
      return res
        .status(500)
        .json({ error: err.message || 'Error al transferir' });
    }
  };

  buscarHistoriasClinicas = async (req, res) => {
    try {
      const { q, year } = req.query;
      // Admins ven todo; estudiantes solo sus propias HCs
      const idEstudiante =
        req.user?.role === 'estudiante' ? req.user.id : undefined;
      const historias = await repo.buscarHistorias({ q, year, idEstudiante });
      return res.status(200).json(historias);
    } catch (err) {
      return res
        .status(500)
        .json({ error: err.message || 'Error en la búsqueda' });
    }
  };

  asignarPacienteAHistoriaClinica = async (req, res) => {
    try {
      const agregado = this.construirAgregadoAsignacion(req);
      await repo.asignarPaciente(agregado);
      return res
        .status(200)
        .json({ message: 'Paciente asignado a la historia clinica' });
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({
        error: err.message || 'Error al asignar paciente a la historia',
      });
    }
  };
}
