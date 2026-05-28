import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import HigieneBocalTestingAPI from '../support/HigieneBocalTestingAPI.js';
import { DomainError } from '../../higieneBocal/domain/higieneBocalDomain.js';

// ── Stub / Mock en memoria ────────────────────────────────────────────────────

class InMemoryHigieneBocalRepository {
  constructor() {
    this.store = new Map();
  }

  async consultarPorHistoria(idHistory) {
    return this.store.get(idHistory) ?? null;
  }

  // Upsert: replica la semántica real del módulo (sin create separado).
  // La clave es el idHistory normalizado que viene en params[0].
  async actualizarHigieneBocal(dataOrAggregate) {
    const params =
      typeof dataOrAggregate.obtenerParametros === 'function'
        ? dataOrAggregate.obtenerParametros()
        : [
            dataOrAggregate?.idHistory,
            dataOrAggregate?.estadoHigiene,
            dataOrAggregate?.idUsuario,
          ];

    const idHistory = params[0];
    this.store.set(idHistory, { idHistory, params });
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
  repository = new InMemoryHigieneBocalRepository();
  api = new HigieneBocalTestingAPI(repository);
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

Given('los datos de higiene bucal:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given(
  'existe higiene bucal para la historia clínica {string} con estado {string} y usuario {string}',
  async function (id_historia, estado_higiene, id_usuario) {
    await api.updateHigieneBocal({ id_historia, estado_higiene, id_usuario });
  }
);

// ── When ──────────────────────────────────────────────────────────────────────

When('se actualiza la higiene bucal', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.updateHigieneBocal(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta actualizar la higiene bucal', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.updateHigieneBocal(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When(
  'se consulta la higiene bucal de la historia clínica {string}',
  async function (id_historia) {
    lastError = null;
    lastResult = null;
    try {
      lastResult = await api.getHigieneBocal(id_historia);
    } catch (err) {
      lastError = err;
    }
  }
);

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de higiene bucal debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de higiene bucal');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'la higiene bucal debe existir en el repositorio para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.consultarPorHistoria(id_historia);
    assert.ok(found, `No se encontró higiene bucal para ${id_historia}`);
  }
);

Then(
  'la consulta de higiene bucal debe retornar el registro correctamente',
  function () {
    assert.ok(
      lastResult,
      'La consulta de higiene bucal no retornó ningún resultado'
    );
  }
);

Then(
  'se debe lanzar un error de higiene bucal con el mensaje {string}',
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
  'no debe existir higiene bucal para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.consultarPorHistoria(id_historia);
    assert.strictEqual(found, null);
  }
);
