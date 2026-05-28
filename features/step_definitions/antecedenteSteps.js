import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import AntecedenteTestingAPI from '../support/AntecedenteTestingAPI.js';
import { DomainError } from '../../antecedente/domain/antecedenteDomain.js';

// ── Stub / Mock en memoria ────────────────────────────────────────────────────

class InMemoryAntecedenteRepository {
  constructor() {
    this.personalStore = new Map();
    this.medicoStore = new Map();
    this.familiarStore = new Map();
    this.cumplimientoStore = new Map();
  }

  async createAntecedentePersonal(agregado) {
    this.personalStore.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
  }

  async getAntecedentePersonalByHistoria(id_historia) {
    return this.personalStore.get(id_historia) ?? null;
  }

  async updateAntecedentePersonal(agregado) {
    if (!this.personalStore.has(agregado.idHistoria)) {
      return false;
    }
    this.personalStore.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
  }

  async createAntecedenteMedico(agregado) {
    this.medicoStore.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
  }

  async getAntecedenteMedicoByHistoria(id_historia) {
    return this.medicoStore.get(id_historia) ?? null;
  }

  async updateAntecedenteMedico(agregado) {
    if (!this.medicoStore.has(agregado.idHistoria)) {
      return false;
    }
    this.medicoStore.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
  }

  async createAntecedenteFamiliar(agregado) {
    this.familiarStore.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
  }

  async getAntecedenteFamiliarByHistoria(id_historia) {
    return this.familiarStore.get(id_historia) ?? null;
  }

  async updateAntecedenteFamiliar(agregado) {
    if (!this.familiarStore.has(agregado.idHistoria)) {
      return false;
    }
    this.familiarStore.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
  }

  async createAntecedenteCumplimiento(agregado) {
    this.cumplimientoStore.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
  }

  async getAntecedenteCumplimientoByHistoria(id_historia) {
    return this.cumplimientoStore.get(id_historia) ?? null;
  }

  async updateAntecedenteCumplimiento(agregado) {
    if (!this.cumplimientoStore.has(agregado.idHistoria)) {
      return false;
    }
    this.cumplimientoStore.set(agregado.idHistoria, {
      id_historia: agregado.idHistoria,
      params: agregado.obtenerParametros(),
    });
    return true;
  }

  clear() {
    this.personalStore.clear();
    this.medicoStore.clear();
    this.familiarStore.clear();
    this.cumplimientoStore.clear();
  }
}

// ── Estado por escenario ──────────────────────────────────────────────────────

let repository;
let api;
let lastResult;
let lastError;

Before(() => {
  repository = new InMemoryAntecedenteRepository();
  api = new AntecedenteTestingAPI(repository);
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

Given('los datos del antecedente personal:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given('los datos del antecedente médico:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given('los datos del antecedente familiar:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

Given('los datos del seguimiento del tratamiento:', function (dataTable) {
  this.testInput = tableToObject(dataTable);
});

// ── When ──────────────────────────────────────────────────────────────────────

When(
  'se registran los antecedentes personales no patológicos',
  async function () {
    lastError = null;
    lastResult = null;
    try {
      lastResult = await api.registerAntecedentePersonal(this.testInput);
    } catch (err) {
      lastError = err;
    }
  }
);

When(
  'se intenta registrar los antecedentes personales no patológicos',
  async function () {
    lastError = null;
    lastResult = null;
    try {
      lastResult = await api.registerAntecedentePersonal(this.testInput);
    } catch (err) {
      lastError = err;
    }
  }
);

When('se registran los antecedentes personales patológicos', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerAntecedenteMedico(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se registran los antecedentes heredo familiares', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerAntecedenteFamiliar(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se registra el seguimiento del tratamiento', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerSeguimiento(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

When('se intenta registrar el seguimiento del tratamiento', async function () {
  lastError = null;
  lastResult = null;
  try {
    lastResult = await api.registerSeguimiento(this.testInput);
  } catch (err) {
    lastError = err;
  }
});

// ── Then ──────────────────────────────────────────────────────────────────────

Then(
  'la operación de antecedente debe ser exitosa con el mensaje {string}',
  function (expectedMessage) {
    assert.ok(lastResult, 'No hubo resultado en la operación de antecedente');
    assert.strictEqual(lastResult.message, expectedMessage);
  }
);

Then(
  'debe existir el antecedente personal para la historia clínica {string}',
  async function (id_historia) {
    const found =
      await repository.getAntecedentePersonalByHistoria(id_historia);
    assert.ok(found, `No se encontró antecedente personal para ${id_historia}`);
  }
);

Then(
  'debe existir el antecedente médico para la historia clínica {string}',
  async function (id_historia) {
    const found = await repository.getAntecedenteMedicoByHistoria(id_historia);
    assert.ok(found, `No se encontró antecedente médico para ${id_historia}`);
  }
);

Then(
  'debe existir el antecedente familiar para la historia clínica {string}',
  async function (id_historia) {
    const found =
      await repository.getAntecedenteFamiliarByHistoria(id_historia);
    assert.ok(found, `No se encontró antecedente familiar para ${id_historia}`);
  }
);

Then(
  'debe existir el seguimiento del tratamiento para la historia clínica {string}',
  async function (id_historia) {
    const found =
      await repository.getAntecedenteCumplimientoByHistoria(id_historia);
    assert.ok(
      found,
      `No se encontró seguimiento del tratamiento para ${id_historia}`
    );
  }
);

Then(
  'se debe lanzar un error de antecedente con el mensaje {string}',
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
  'no debe existir el antecedente personal para la historia clínica {string}',
  async function (id_historia) {
    const found =
      await repository.getAntecedentePersonalByHistoria(id_historia);
    assert.strictEqual(found, null);
  }
);

Then(
  'no debe existir el seguimiento del tratamiento para la historia clínica {string}',
  async function (id_historia) {
    const found =
      await repository.getAntecedenteCumplimientoByHistoria(id_historia);
    assert.strictEqual(found, null);
  }
);
