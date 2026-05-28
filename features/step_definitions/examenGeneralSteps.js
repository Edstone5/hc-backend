import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import ExamenGeneralTestingAPI from '../support/ExamenGeneralTestingAPI.js';
import { DomainError } from '../../examenGeneral/domain/examenGeneralDomain.js';

// ── Stub / Mock en memoria ────────────────────────────────────────────────────

class InMemoryExamenGeneralRepository {
  constructor() {
    this.store = new Map();
  }

  async create(agregado) {
    const record = {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    };
    this.store.set(agregado.idHistoria, record);
    return record;
  }

  async getByHistoria(id_historia) {
    return this.store.get(id_historia) ?? null;
  }

  async update(agregado) {
    if (!this.store.has(agregado.idHistoria)) {
      return false;
    }
    this.store.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
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
  repository = new InMemoryExamenGeneralRepository();
  api = new ExamenGeneralTestingAPI(repository);
  lastResult = null;
  lastError = null;
});

// ── Utilidades ────────────────────────────────────────────────────────────────

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

Given('los datos del examen físico general:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given(
  'existe un examen físico general con id_historia {string} y temperatura {string}',
  async function (id_historia, temperatura) {
    await api.registerExamenGeneral({ id_historia, temperatura });
  }
);

// ── When ──────────────────────────────────────────────────────────────────────

When('se registra el examen físico general', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerExamenGeneral(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta registrar el examen físico general', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerExamenGeneral(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se actualiza el examen físico general con:', async function (dataTable) {
  lastError = null;
  lastResult = null;
  const input = tableToObject(dataTable);
  try {
    lastResult = await api.updateExamenGeneral(input);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'el examen físico general debe existir en el repositorio para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.ok(
      found,
      `No se encontró examen físico general para ${id_historia}`
    );
  }
);

Then(
  'la operación de actualización de examen general debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de actualización');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'la temperatura normalizada debe ser nula para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.ok(
      found,
      `No se encontró examen físico general para ${id_historia}`
    );
    // params[9] = temperatura según ExamenFisicoGeneralAggregate.obtenerParametros()
    assert.strictEqual(
      found.params[9],
      null,
      `Se esperaba temperatura null pero se obtuvo: ${found.params[9]}`
    );
  }
);

Then(
  'la presión arterial normalizada debe ser nula para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.ok(
      found,
      `No se encontró examen físico general para ${id_historia}`
    );
    // params[10] = presion_arterial según ExamenFisicoGeneralAggregate.obtenerParametros()
    assert.strictEqual(
      found.params[10],
      null,
      `Se esperaba presión arterial null pero se obtuvo: ${found.params[10]}`
    );
  }
);

Then(
  'se debe lanzar un error de examen general con el mensaje {string}',
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

Then(
  'no debe existir el examen físico general para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.strictEqual(found, null);
  }
);
