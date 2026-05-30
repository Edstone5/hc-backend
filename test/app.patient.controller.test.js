/**
 * Tests for patient/application/patientController.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPatientRepo = vi.hoisted(() => ({
  crearPaciente: vi.fn(),
  actualizarPaciente: vi.fn(),
}));

vi.mock('../patient/infrastructure/patientRepository.js', () => ({
  PatientRepository: class {
    constructor() {
      return mockPatientRepo;
    }
  },
}));

import { PatientController } from '../patient/application/patientController.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeRes() {
  const r = { status: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  return r;
}

describe('PatientController.registrarPaciente', () => {
  let req, res;
  beforeEach(() => {
    req = {
      body: {
        nombre: 'Juan',
        apellido: 'Perez',
        dni: '12345678',
        fechaNacimiento: '1990-01-01',
        sexo: 'M',
        telefono: '987654321',
        email: 'juan@test.com',
      },
      params: {},
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 201 with id on success', async () => {
    mockPatientRepo.crearPaciente.mockResolvedValue({ id: VALID_UUID });
    await PatientController.registrarPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: VALID_UUID });
  });

  it('returns 400 on DomainError (empty nombre)', async () => {
    req.body.nombre = '';
    await PatientController.registrarPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 on DomainError (empty apellido)', async () => {
    req.body.apellido = '';
    await PatientController.registrarPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when DNI duplicate error', async () => {
    mockPatientRepo.crearPaciente.mockRejectedValue(
      new Error('Ya existe un paciente con ese DNI')
    );
    await PatientController.registrarPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 500 on unexpected error', async () => {
    mockPatientRepo.crearPaciente.mockRejectedValue(new Error('DB down'));
    await PatientController.registrarPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('PatientController.actualizarPaciente', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id: VALID_UUID },
      body: {
        nombre: 'Juan',
        apellido: 'Perez',
        telefono: '987654321',
        email: 'juan@test.com',
      },
    };
    res = makeRes();
    vi.clearAllMocks();
  });

  it('returns 200 on success', async () => {
    mockPatientRepo.actualizarPaciente.mockResolvedValue(undefined);
    await PatientController.actualizarPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Datos del paciente actualizados correctamente',
    });
  });

  it('returns 400 on DomainError (invalid UUID)', async () => {
    req.params.id = 'not-a-uuid';
    await PatientController.actualizarPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when patient not found', async () => {
    mockPatientRepo.actualizarPaciente.mockRejectedValue(
      new Error('No existe un paciente con ese ID')
    );
    await PatientController.actualizarPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected error', async () => {
    mockPatientRepo.actualizarPaciente.mockRejectedValue(new Error('DB down'));
    await PatientController.actualizarPaciente(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
