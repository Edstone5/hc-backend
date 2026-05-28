import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import ExamenBocaTestingAPI from '../support/ExamenBocaTestingAPI.js';
import { DomainError } from '../../examenBoca/domain/examenBocaDomain.js';

// ── Stub / Mock en memoria ────────────────────────────────────────────────────

class InMemoryExamenBocaRepository {
  constructor() {
    this.store = new Map();
  }

  async getByHistoria(id_historia) {
    return this.store.get(id_historia) ?? null;
  }

  // Upsert: refleja que el módulo no tiene create separado.
  async update(agregado) {
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
  repository = new InMemoryExamenBocaRepository();
  api = new ExamenBocaTestingAPI(repository);
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

Given('los datos del examen de boca:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given(
  'existe un examen de boca para la historia clínica {string}',
  async function (id_historia) {
    await api.updateExamenBoca({ id_historia });
  }
);

// ── When ──────────────────────────────────────────────────────────────────────

When('se actualiza el examen de boca', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.updateExamenBoca(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta actualizar el examen de boca', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.updateExamenBoca(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When(
  'se consulta el examen de boca de la historia clínica {string}',
  async function (id_historia) {
    lastError = null;
    lastResult = null;
    try {
      lastResult = await api.getExamenBoca(id_historia);
    } catch (err) {
      lastError = err;
    }
  }
);

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de examen de boca debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(
      lastResult,
      'No hubo resultado en la operación de examen de boca'
    );
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'el examen de boca debe existir en el repositorio para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.ok(found, `No se encontró examen de boca para ${id_historia}`);
  }
);

Then(
  'la consulta del examen de boca debe retornar el registro correctamente',
  function () {
    assert.ok(
      lastResult,
      'La consulta del examen de boca no retornó ningún resultado'
    );
  }
);

Then(
  'el campo labios con lesiones debe ser nulo para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.ok(found, `No se encontró examen de boca para ${id_historia}`);
    // params[2] = labiosCon según ExamenBocaAggregate.obtenerParametros()
    assert.strictEqual(
      found.params[2],
      null,
      `Se esperaba labiosCon null pero se obtuvo: ${found.params[2]}`
    );
  }
);

Then(
  'se debe lanzar un error de examen de boca con el mensaje {string}',
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
  'no debe existir el examen de boca para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.strictEqual(found, null);
  }
);
