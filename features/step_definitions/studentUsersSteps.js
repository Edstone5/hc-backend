import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import StudentUsersTestingAPI, {
  DomainError,
} from '../support/StudentUsersTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryStudentUsersRepository {
  constructor() {
    this.store = new Map([['estudiante', [{ id: 1, nombre: 'María García' }]]]);
  }

  async getByRole(role) {
    return this.store.get(role) ?? [];
  }

  clear() {
    // No limpiar datos base
  }
}

// ── Estado por escenario ──────────────────────────────────────────────────────

let repository;
let api;
let lastResult;
let lastError;

Before(() => {
  repository = new InMemoryStudentUsersRepository();
  api = new StudentUsersTestingAPI(repository);
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

Given('el rol de usuario a consultar:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se consultan los usuarios por rol', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.consultarPorRol(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta consultar los usuarios por rol', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.consultarPorRol(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de student users debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de student users');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'se debe lanzar un error de student users con el mensaje {string}',
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
