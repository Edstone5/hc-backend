import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import EvolucionTestingAPI, {
  DomainError,
} from '../support/EvolucionTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryEvolucionRepository {
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
  repository = new InMemoryEvolucionRepository();
  api = new EvolucionTestingAPI(repository);
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

Given('los datos de evolución:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se registra la evolución clínica', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarEvolucion(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta registrar la evolución clínica', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarEvolucion(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de evolución debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de evolución');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then('el parámetro de fecha de la evolución debe ser nulo', function () {
  const last = repository.getLast();
  assert.ok(last, 'No se guardó ningún registro de evolución');
  // params[1] = fecha
  assert.strictEqual(
    last[1],
    null,
    `Se esperaba fecha null pero se obtuvo: ${last[1]}`
  );
});

Then(
  'se debe lanzar un error de evolución con el mensaje {string}',
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
