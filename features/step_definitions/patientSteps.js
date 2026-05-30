import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import PatientTestingAPI, {
  DomainError,
} from '../support/PatientTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryPatientRepository {
  constructor() {
    this.records = [];
  }

  async save(params) {
    this.records.push(params);
    return true;
  }

  getLast() {
    return this.records[this.records.length - 1] ?? null;
  }

  clear() {
    this.records = [];
  }
}

// ── Estado por escenario ──────────────────────────────────────────────────────

let repository;
let api;
let lastResult;
let lastError;

Before(() => {
  repository = new InMemoryPatientRepository();
  api = new PatientTestingAPI(repository);
  lastResult = null;
  lastError = null;
});

// ── Utilidad de tabla ─────────────────────────────────────────────────────────

function tableToObject(table) {
  if (!table) {
    return {};
  }
  const raw = table.raw();
  if (!raw || raw.length < 2) {
    return {};
  }
  const headers = raw[0].map((h) => String(h).trim());
  const values = raw[1];
  const obj = {};
  for (let i = 0; i < headers.length; i++) {
    obj[headers[i]] = values[i] === undefined ? '' : String(values[i]).trim();
  }
  return obj;
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('los datos del paciente a registrar:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se registra el paciente', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarPaciente(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta registrar el paciente', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarPaciente(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de paciente debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de paciente');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then('los campos opcionales del paciente deben ser nulos', function () {
  const last = repository.getLast();
  assert.ok(last, 'No se guardó ningún paciente');
  // obtenerParametrosParaCrear: [nombre, apellido, dni, fechaNacimiento, sexo, telefono, email]
  assert.strictEqual(
    last[2],
    null,
    `Se esperaba dni null pero se obtuvo: ${last[2]}`
  );
  assert.strictEqual(
    last[3],
    null,
    `Se esperaba fechaNacimiento null pero se obtuvo: ${last[3]}`
  );
  assert.strictEqual(
    last[4],
    null,
    `Se esperaba sexo null pero se obtuvo: ${last[4]}`
  );
  assert.strictEqual(
    last[5],
    null,
    `Se esperaba telefono null pero se obtuvo: ${last[5]}`
  );
  assert.strictEqual(
    last[6],
    null,
    `Se esperaba email null pero se obtuvo: ${last[6]}`
  );
});

Then(
  'se debe lanzar un error de paciente con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(
      lastError,
      'Se esperaba un error de dominio pero no se lanzó ninguno'
    );
    assert.ok(
      lastError instanceof DomainError,
      `El error no es un DomainError: ${lastError?.name}`
    );
    assert.strictEqual(lastError.message, expectedMessage);
  }
);
