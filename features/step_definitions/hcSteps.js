import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import HcTestingAPI, { DomainError } from '../support/HcTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryHcRepository {
  constructor() {
    this.store = new Map();
  }

  async save(type, params) {
    this.store.set(type, params);
    return true;
  }

  async get(type) {
    return this.store.get(type) ?? null;
  }

  clear() {
    this.store.clear();
  }
}

// ── Estado por escenario ──────────────────────────────────────────────────────

let repository;
let api;
let lastResult;
let lastError;

Before(() => {
  repository = new InMemoryHcRepository();
  api = new HcTestingAPI(repository);
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

Given('los datos de registro de historia clínica:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given('los datos de revisión de historia clínica:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given('los datos de asignación de paciente:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se registra la historia clínica', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarHC(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta registrar la historia clínica', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarHC(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se revisa la historia clínica', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.revisarHC(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta revisar la historia clínica', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.revisarHC(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se asigna el paciente a la historia clínica', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.asignarPaciente(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de hc debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de HC');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'se debe lanzar un error de hc con el mensaje {string}',
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
