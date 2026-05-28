import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import MotivoConsultaTestingAPI from '../support/MotivoConsultaTestingAPI.js';
import { DomainError } from '../../motivoConsulta/domain/motivoConsultaDomain.js';

// ── Stub / Mock en memoria ────────────────────────────────────────────────────

class InMemoryMotivoConsultaRepository {
  constructor() {
    this.store = new Map();
  }

  async create(agregado) {
    this.store.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
  }

  async getByHistoria(id_historia) {
    return this.store.get(id_historia) ?? null;
  }

  // Replica el contrato real: usa agregado.idHistoria y agregado.motivo directamente
  async update(agregado) {
    if (!this.store.has(agregado.idHistoria)) {
      return false;
    }
    this.store.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: [agregado.idHistoria, agregado.motivo],
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
  repository = new InMemoryMotivoConsultaRepository();
  api = new MotivoConsultaTestingAPI(repository);
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

Given('los datos del motivo de consulta:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given(
  'existe un motivo de consulta con id_historia {string} y motivo {string}',
  async function (id_historia, motivo) {
    await api.registerMotivoConsulta({ id_historia, motivo });
  }
);

// ── When ──────────────────────────────────────────────────────────────────────

When('se registra el motivo de consulta', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerMotivoConsulta(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta registrar el motivo de consulta', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerMotivoConsulta(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se actualiza el motivo de consulta con:', async function (dataTable) {
  lastError = null;
  lastResult = null;
  const input = tableToObject(dataTable);
  try {
    lastResult = await api.updateMotivoConsulta(input);
  } catch (err) {
    lastError = err;
  }
});

When(
  'se consulta el motivo de consulta de la historia clínica {string}',
  async function (id_historia) {
    lastError = null;
    lastResult = null;
    try {
      lastResult = await api.getMotivoConsulta(id_historia);
    } catch (err) {
      lastError = err;
    }
  }
);

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de motivo de consulta debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'debe existir el motivo de consulta para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.ok(found, `No se encontró motivo de consulta para ${id_historia}`);
  }
);

Then(
  'el motivo almacenado para la historia clínica {string} debe ser {string}',
  async function (id_historia, expectedMotivo) {
    const found = await repository.getByHistoria(id_historia);
    assert.ok(found, `No se encontró motivo de consulta para ${id_historia}`);
    // params[1] = motivo según MotivoConsultaAggregate.obtenerParametros()
    assert.strictEqual(found.params[1], expectedMotivo);
  }
);

Then(
  'la consulta de motivo debe retornar el registro correctamente',
  function () {
    assert.ok(lastResult, 'La consulta no retornó ningún resultado');
  }
);

Then('el motivo consultado debe ser {string}', function (expectedMotivo) {
  assert.ok(lastResult, 'No hay resultado de consulta disponible');
  // params[1] = motivo
  assert.strictEqual(lastResult.params[1], expectedMotivo);
});

Then(
  'se debe lanzar un error de motivo de consulta con el mensaje {string}',
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
  'no debe existir el motivo de consulta para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getByHistoria(id_historia);
    assert.strictEqual(found, null);
  }
);
