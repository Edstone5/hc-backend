import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import AuthTestingAPI, { DomainError } from '../support/AuthTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryAuthRepository {
  constructor() {
    this.lastSession = null;
  }

  async save(session) {
    this.lastSession = session;
    return true;
  }

  getLastSession() {
    return this.lastSession;
  }

  clear() {
    this.lastSession = null;
  }
}

// ── Estado por escenario ──────────────────────────────────────────────────────

let repository;
let api;
let lastResult;
let lastError;

Before(() => {
  repository = new InMemoryAuthRepository();
  api = new AuthTestingAPI(repository);
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
    // No trimear la contraseña (puede tener espacios intencionales)
    obj[headers[i]] = values[i] === undefined ? '' : String(values[i]);
  }
  return obj;
}

// ── Given ─────────────────────────────────────────────────────────────────────

Given('las credenciales de autenticación:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se intenta autenticar al usuario', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.autenticar(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de autenticación debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de autenticación');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'el código de usuario autenticado debe ser {string}',
  function (expectedCode) {
    assert.ok(lastResult, 'No hubo resultado en la operación de autenticación');
    assert.strictEqual(lastResult.userCode, expectedCode);
  }
);

Then(
  'se debe lanzar un error de autenticación con el mensaje {string}',
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
