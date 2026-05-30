import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import UserTestingAPI, { DomainError } from '../support/UserTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryUserRepository {
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
  repository = new InMemoryUserRepository();
  api = new UserTestingAPI(repository);
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

Given('los datos del usuario a registrar:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se registra el usuario', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarUsuario(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta registrar el usuario', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registrarUsuario(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de usuario debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de usuario');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then('el dni del usuario registrado debe ser nulo', function () {
  const last = repository.getLast();
  assert.ok(last, 'No se guardó ningún usuario');
  // params[3] = dni
  assert.strictEqual(
    last[3],
    null,
    `Se esperaba dni null pero se obtuvo: ${last[3]}`
  );
});

Then(
  'se debe lanzar un error de usuario con el mensaje {string}',
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
