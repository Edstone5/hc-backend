import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import CatalogoTestingAPI, {
  DomainError,
} from '../support/CatalogoTestingAPI.js';

// ── Repositorio in-memory ─────────────────────────────────────────────────────

class InMemoryCatalogoRepository {
  constructor() {
    this.store = new Map([
      [
        'catalogo_sexo',
        [
          { id: 1, nombre: 'Masculino' },
          { id: 2, nombre: 'Femenino' },
        ],
      ],
      [
        'catalogo_estado_civil',
        [
          { id: 1, nombre: 'Soltero' },
          { id: 2, nombre: 'Casado' },
        ],
      ],
    ]);
  }

  async getByName(name) {
    return this.store.get(name) ?? [];
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
  repository = new InMemoryCatalogoRepository();
  api = new CatalogoTestingAPI(repository);
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

Given('el nombre del catálogo a consultar:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When('se consulta el catálogo', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.consultarCatalogo(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta consultar el catálogo', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.consultarCatalogo(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de catálogo debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de catálogo');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'se debe lanzar un error de catálogo con el mensaje {string}',
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
