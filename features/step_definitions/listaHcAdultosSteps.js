import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import ListaHcAdultosTestingAPI, {
  DomainError,
} from '../support/ListaHcAdultosTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryListaHcRepository {
  constructor() {
    this.store = new Map();
  }

  async getByStudent(idEstudiante) {
    return this.store.get(idEstudiante) ?? [];
  }

  async seed(idEstudiante, data) {
    this.store.set(idEstudiante, data);
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
  repository = new InMemoryListaHcRepository();
  api = new ListaHcAdultosTestingAPI(repository);
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

Given('el ID del estudiante para consultar sus HCs:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se consultan las HCs adultas del estudiante', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.consultarHCsAdultos(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta consultar las HCs adultas del estudiante', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.consultarHCsAdultos(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de lista HC adultos debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(
      lastResult,
      'No hubo resultado en la operación de lista HC adultos'
    );
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'se debe lanzar un error de lista HC adultos con el mensaje {string}',
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
