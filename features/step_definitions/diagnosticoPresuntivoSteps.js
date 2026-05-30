import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import DiagnosticoPresuntivoTestingAPI, {
  DomainError,
} from '../support/DiagnosticoPresuntivoTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryDiagPresuntivoRepository {
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
  repository = new InMemoryDiagPresuntivoRepository();
  api = new DiagnosticoPresuntivoTestingAPI(repository);
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

Given('los datos del diagnóstico presuntivo:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se actualiza el diagnóstico presuntivo', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.actualizarDiagnostico(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta actualizar el diagnóstico presuntivo', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.actualizarDiagnostico(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de diagnóstico presuntivo debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(
      lastResult,
      'No hubo resultado en la operación de diagnóstico presuntivo'
    );
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then('la descripción del diagnóstico presuntivo debe ser nula', function () {
  const last = repository.getLast();
  assert.ok(last, 'No se guardó ningún diagnóstico presuntivo');
  // params[1] = descripcion
  assert.strictEqual(
    last[1],
    null,
    `Se esperaba descripcion null pero se obtuvo: ${last[1]}`
  );
});

Then(
  'se debe lanzar un error de diagnóstico presuntivo con el mensaje {string}',
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
