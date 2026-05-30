import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import DiagnosticoClinicasTestingAPI, {
  DomainError,
} from '../support/DiagnosticoClinicasTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryDiagClinicasRepository {
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
  repository = new InMemoryDiagClinicasRepository();
  api = new DiagnosticoClinicasTestingAPI(repository);
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

Given('los datos del diagnóstico de clínicas:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se registra el diagnóstico de clínicas', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarDiagnostico(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta registrar el diagnóstico de clínicas', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarDiagnostico(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de diagnóstico clínico debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(
      lastResult,
      'No hubo resultado en la operación de diagnóstico clínico'
    );
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'los campos opcionales del diagnóstico clínico deben ser nulos',
  function () {
    const last = repository.getLast();
    assert.ok(last, 'No se guardó ningún diagnóstico clínico');
    // params[2] = clinicaRespuesta, debe ser null cuando se envió vacío
    assert.strictEqual(
      last[2],
      null,
      `Se esperaba clinicaRespuesta null pero se obtuvo: ${last[2]}`
    );
  }
);

Then(
  'se debe lanzar un error de diagnóstico clínico con el mensaje {string}',
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
