import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import EnfermedadActualTestingAPI from '../support/EnfermedadActualTestingAPI.js';
import { DomainError } from '../../enfermedadActual/domain/enfermedadActualDomain.js';

// ── Stub / Mock en memoria ────────────────────────────────────────────────────

class InMemoryEnfermedadActualRepository {
  constructor() {
    this.store = new Map();
  }

  async create(agregado) {
    this.store.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return { success: true, id_historia: agregado.idHistoria };
  }

  async getByHistoria(id_historia) {
    return this.store.get(id_historia) ?? null;
  }

  async update(agregado) {
    if (!this.store.has(agregado.idHistoria)) {
      return { success: false };
    }
    this.store.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return { success: true, id_historia: agregado.idHistoria };
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
  repository = new InMemoryEnfermedadActualRepository();
  api = new EnfermedadActualTestingAPI(repository);
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

Given('los datos de enfermedad actual:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given(
  'existe una enfermedad actual con id_historia {string} y síntoma principal {string}',
  async function (id_historia, sintoma_principal) {
    await api.registerEnfermedadActual({ id_historia, sintoma_principal });
  }
);

// ── When ──────────────────────────────────────────────────────────────────────

When('se registra la enfermedad actual', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerEnfermedadActual(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta registrar la enfermedad actual', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerEnfermedadActual(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se actualiza la enfermedad actual con:', async function (dataTable) {
  lastError = null;
  lastResult = null;
  const input = tableToObject(dataTable);
  try {
    lastResult = await api.updateEnfermedadActual(input);
  } catch (err) {
    lastError = err;
  }
});

When(
  'se consulta la enfermedad actual de la historia clínica {string}',
  async function (id_historia) {
    lastError = null;
    lastResult = null;
    try {
      lastResult = await api.getEnfermedadActual(id_historia);
    } catch (err) {
      lastError = err;
    }
  }
);

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de registro debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de registro');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'la operación de actualización debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de actualización');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'debe existir la enfermedad actual para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.ok(found, `No se encontró enfermedad actual para ${id_historia}`);
  }
);

Then(
  'el síntoma principal para la historia clínica {string} debe ser {string}',
  async function (id_historia, expectedSintoma) {
    const found = await repository.getByHistoria(id_historia);
    assert.ok(found, `No se encontró enfermedad actual para ${id_historia}`);
    // params[1] = sintoma_principal según EnfermedadActualAggregate.obtenerParametros()
    assert.strictEqual(found.params[1], expectedSintoma);
  }
);

Then(
  'la consulta debe retornar la enfermedad actual correctamente',
  function () {
    assert.ok(lastResult, 'La consulta no retornó ningún resultado');
  }
);

Then(
  'el síntoma principal consultado debe ser {string}',
  function (expectedSintoma) {
    assert.ok(lastResult, 'No hay resultado de consulta disponible');
    assert.strictEqual(lastResult.params[1], expectedSintoma);
  }
);

Then(
  'se debe lanzar un error de enfermedad actual con el mensaje {string}',
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
  'no debe existir enfermedad actual para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.strictEqual(found, null);
  }
);
