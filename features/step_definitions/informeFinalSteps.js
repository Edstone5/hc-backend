import assert from 'assert';
import { Given, When, Then, Before } from '@cucumber/cucumber';
import {
  DomainError,
  InformeFinalAggregate,
} from '../../informeFinal/domain/informeFinalDomain.js';
import { NotificacionAggregate } from '../../notificacion/domain/notificacionDomain.js';

class InMemoryInformeFinalRepository {
  constructor() {
    this.informes = new Map();
    this.seq = 0;
  }

  async registrar(agg) {
    const id = `informe-${++this.seq}`;
    this.informes.set(id, {
      id_informe: id,
      id_historia: agg.idHistoria,
      generado_por: agg.generadoPor,
      estado: agg.estado,
      secciones: JSON.stringify(agg.secciones),
      fecha_generacion: agg.fechaGeneracion,
    });
    return id;
  }

  async listarPorHistoria(idHistoria) {
    return [...this.informes.values()].filter(
      (i) => i.id_historia === idHistoria
    );
  }

  async obtenerPorId(idInforme) {
    return this.informes.get(idInforme) || null;
  }

  async actualizarEstado(idInforme, estado) {
    const fila = this.informes.get(idInforme);
    if (fila) {
      fila.estado = estado;
    }
    return true;
  }
}

class InMemoryNotificaciones {
  constructor() {
    this.enviadas = [];
  }

  async registrar(agg) {
    this.enviadas.push(agg);
    return `notif-${this.enviadas.length}`;
  }
}

let repo;
let notificaciones;
let contexto;
let ultimoInformeId;
let lastError;

Before(() => {
  repo = new InMemoryInformeFinalRepository();
  notificaciones = new InMemoryNotificaciones();
  contexto = {};
  ultimoInformeId = null;
  lastError = null;
});

Given(
  'un caso clínico con historia {string} del estudiante {string}',
  function (idHistoria, idEstudiante) {
    contexto.idHistoria = idHistoria;
    contexto.generadoPor = idEstudiante;
  }
);

Given(
  'el caso compila encabezado, procedimientos y odontograma final',
  function () {
    contexto.secciones = {
      encabezado: `HC ${contexto.idHistoria}`,
      procedimientos: [
        { fecha: '2026-07-01', detalle: 'Obturación pieza 1.6' },
      ],
      odontograma: 'svg-final',
    };
  }
);

Given('el caso compila solo encabezado y procedimientos', function () {
  contexto.secciones = {
    encabezado: `HC ${contexto.idHistoria}`,
    procedimientos: [{ fecha: '2026-07-01', detalle: 'Obturación pieza 1.6' }],
  };
});

async function generarInforme() {
  try {
    const agg = new InformeFinalAggregate({
      idHistoria: contexto.idHistoria,
      generadoPor: contexto.generadoPor,
      secciones: contexto.secciones,
    });
    ultimoInformeId = await repo.registrar(agg);
    lastError = null;
  } catch (e) {
    lastError = e;
  }
}

When('genero el informe final', generarInforme);

async function enviarParaValidacion(idDocente) {
  try {
    const fila = await repo.obtenerPorId(ultimoInformeId);
    const agg = new InformeFinalAggregate({
      idHistoria: fila.id_historia,
      generadoPor: fila.generado_por,
      estado: fila.estado,
      secciones: JSON.parse(fila.secciones),
    });
    agg.enviarParaValidacion();
    await repo.actualizarEstado(ultimoInformeId, agg.estado);
    await notificaciones.registrar(
      new NotificacionAggregate({
        idDestinatario: idDocente,
        titulo: 'Informe final enviado para validación',
        mensaje: `El informe final de la historia ${agg.idHistoria} espera su validación.`,
        tipo: 'validacion',
        idReferencia: ultimoInformeId,
      })
    );
    lastError = null;
  } catch (e) {
    lastError = e;
  }
}

When(
  'envío el informe para validación del docente {string}',
  enviarParaValidacion
);

Then('el informe queda en estado {string}', async function (estado) {
  assert.strictEqual(lastError, null);
  const fila = await repo.obtenerPorId(ultimoInformeId);
  assert.strictEqual(fila.estado, estado);
});

Then(
  'el historial de la historia {string} tiene {int} informe',
  async function (idHistoria, cantidad) {
    const historial = await repo.listarPorHistoria(idHistoria);
    assert.strictEqual(historial.length, cantidad);
  }
);

Then(
  'el historial de la historia {string} tiene {int} informes',
  async function (idHistoria, cantidad) {
    const historial = await repo.listarPorHistoria(idHistoria);
    assert.strictEqual(historial.length, cantidad);
  }
);

Then(
  'el docente {string} recibe una notificación de tipo {string}',
  function (idDocente, tipo) {
    const recibidas = notificaciones.enviadas.filter(
      (n) => n.idDestinatario === idDocente && n.tipo === tipo
    );
    assert.ok(recibidas.length >= 1);
  }
);

Then(
  'se debe lanzar un error de dominio del informe con el mensaje {string}',
  function (mensaje) {
    assert.ok(lastError, 'se esperaba un error de dominio');
    assert.ok(
      lastError instanceof DomainError || lastError.name === 'DomainError'
    );
    assert.strictEqual(lastError.message, mensaje);
  }
);
