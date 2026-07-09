import { describe, it, expect } from 'vitest';
import {
  DomainError,
  InformeFinalAggregate,
  IInformeFinalRepository,
} from '../informeFinal/domain/informeFinalDomain.js';

const UUID_HISTORIA = '550e8400-e29b-41d4-a716-446655440000';
const UUID_ESTUDIANTE = '123e4567-e89b-42d3-a456-426614174000';

const seccionesMinimas = () => ({
  encabezado: 'HC 550e8400 — Paciente adulto',
  procedimientos: [{ fecha: '2026-07-01', detalle: 'Obturación pieza 1.6' }],
  odontograma: 'svg-final',
});

const seccionesCompletas = () => ({
  ...seccionesMinimas(),
  medicamentos: [{ nombre: 'Amoxicilina', dosis: '500mg' }],
  adjuntos: ['radiografia-panoramica.png'],
  incidencias: 'ninguna',
  evaluacionDocente: { estado: 'validado', puntaje: 18 },
});

const build = (extra = {}) =>
  new InformeFinalAggregate({
    idHistoria: UUID_HISTORIA,
    generadoPor: UUID_ESTUDIANTE,
    secciones: seccionesMinimas(),
    ...extra,
  });

// ── DomainError ──────────────────────────────────────────────────────────────

describe('DomainError', () => {
  it('es instancia de Error', () => {
    expect(new DomainError('x')).toBeInstanceOf(Error);
  });

  it('name === "DomainError"', () => {
    expect(new DomainError('x').name).toBe('DomainError');
  });

  it('preserva el mensaje', () => {
    expect(new DomainError('mensaje test').message).toBe('mensaje test');
  });
});

// ── Invariantes del agregado ─────────────────────────────────────────────────

describe('InformeFinalAggregate — invariantes', () => {
  it('camino feliz con secciones mínimas', () => {
    const agg = build();
    expect(agg.idHistoria).toBe(UUID_HISTORIA);
    expect(agg.generadoPor).toBe(UUID_ESTUDIANTE);
    expect(agg.estado).toBe('generado');
  });

  it('idHistoria ausente → lanza mensaje exacto', () => {
    expect(() => build({ idHistoria: undefined })).toThrow(
      'idHistoria inválido'
    );
  });

  it('idHistoria no UUID → lanza mensaje exacto', () => {
    expect(() => build({ idHistoria: 'no-es-uuid' })).toThrow(
      'idHistoria inválido'
    );
  });

  it('idHistoria cadena vacía → lanza (mata || → &&)', () => {
    expect(() => build({ idHistoria: '' })).toThrow('idHistoria inválido');
  });

  it('generadoPor ausente → lanza mensaje exacto', () => {
    expect(() => build({ generadoPor: undefined })).toThrow(
      'generadoPor inválido'
    );
  });

  it('generadoPor no UUID → lanza mensaje exacto', () => {
    expect(() => build({ generadoPor: 'estudiante-1' })).toThrow(
      'generadoPor inválido'
    );
  });

  it('estado desconocido → lanza con listado de estados', () => {
    expect(() => build({ estado: 'borrador' })).toThrow(
      'estado debe ser: generado, enviado_validacion, validado'
    );
  });

  it('acepta estado explícito válido', () => {
    expect(build({ estado: 'validado' }).estado).toBe('validado');
  });

  it('secciones ausente → lanza mensaje exacto', () => {
    expect(() => build({ secciones: undefined })).toThrow(
      'secciones debe ser el contenido compilado del informe'
    );
  });

  it('secciones como arreglo → lanza (no es objeto compilado)', () => {
    expect(() => build({ secciones: [] })).toThrow(
      'secciones debe ser el contenido compilado del informe'
    );
  });

  it('sin encabezado → lanza con secciones mínimas', () => {
    const s = seccionesMinimas();
    delete s.encabezado;
    expect(() => build({ secciones: s })).toThrow(
      'el informe debe compilar: encabezado, procedimientos, odontograma'
    );
  });

  it('sin odontograma → lanza con secciones mínimas', () => {
    const s = seccionesMinimas();
    s.odontograma = '';
    expect(() => build({ secciones: s })).toThrow(
      'el informe debe compilar: encabezado, procedimientos, odontograma'
    );
  });

  it('procedimientos no es arreglo → lanza mensaje exacto', () => {
    const s = seccionesMinimas();
    s.procedimientos = 'Obturación';
    expect(() => build({ secciones: s })).toThrow(
      'procedimientos debe ser un listado'
    );
  });

  it('normaliza idHistoria e generadoPor con trim', () => {
    const agg = new InformeFinalAggregate({
      idHistoria: `  ${UUID_HISTORIA}  `,
      generadoPor: `  ${UUID_ESTUDIANTE}  `,
      secciones: seccionesMinimas(),
    });
    expect(agg.idHistoria).toBe(UUID_HISTORIA);
    expect(agg.generadoPor).toBe(UUID_ESTUDIANTE);
  });

  it('copia defensiva de secciones', () => {
    const s = seccionesMinimas();
    const agg = build({ secciones: s });
    s.encabezado = 'mutado';
    expect(agg.secciones.encabezado).not.toBe('mutado');
  });

  it('registra fechaGeneracion en ISO 8601', () => {
    expect(() => new Date(build().fechaGeneracion).toISOString()).not.toThrow();
  });
});

// ── esCompleto ───────────────────────────────────────────────────────────────

describe('InformeFinalAggregate.esCompleto', () => {
  it('solo secciones mínimas → false', () => {
    expect(build().esCompleto()).toBe(false);
  });

  it('con medicamentos, adjuntos y evaluación docente → true', () => {
    expect(build({ secciones: seccionesCompletas() }).esCompleto()).toBe(true);
  });

  it('falta evaluación docente → false', () => {
    const s = seccionesCompletas();
    delete s.evaluacionDocente;
    expect(build({ secciones: s }).esCompleto()).toBe(false);
  });
});

// ── Transición de estado ─────────────────────────────────────────────────────

describe('InformeFinalAggregate.enviarParaValidacion', () => {
  it('generado → enviado_validacion', () => {
    const agg = build();
    agg.enviarParaValidacion();
    expect(agg.estado).toBe('enviado_validacion');
  });

  it('devuelve el propio agregado', () => {
    const agg = build();
    expect(agg.enviarParaValidacion()).toBe(agg);
  });

  it('doble envío → lanza mensaje exacto', () => {
    const agg = build();
    agg.enviarParaValidacion();
    expect(() => agg.enviarParaValidacion()).toThrow(
      'el informe ya fue enviado para validación'
    );
  });

  it('informe validado → lanza mensaje exacto', () => {
    const agg = build({ estado: 'validado' });
    expect(() => agg.enviarParaValidacion()).toThrow(
      'un informe validado no admite reenvío'
    );
  });
});

// ── Mapeo a infraestructura ──────────────────────────────────────────────────

describe('InformeFinalAggregate.obtenerParametros', () => {
  it('orden posicional: historia, autor, estado, secciones JSON, fecha', () => {
    const agg = build();
    const p = agg.obtenerParametros();
    expect(p[0]).toBe(UUID_HISTORIA);
    expect(p[1]).toBe(UUID_ESTUDIANTE);
    expect(p[2]).toBe('generado');
    expect(JSON.parse(p[3]).odontograma).toBe('svg-final');
    expect(p[4]).toBe(agg.fechaGeneracion);
  });

  it('longitud exacta de 5 parámetros', () => {
    expect(build().obtenerParametros()).toHaveLength(5);
  });
});

// ── Puerto de repositorio ────────────────────────────────────────────────────

describe('IInformeFinalRepository', () => {
  it('métodos del puerto rechazan sin implementación', async () => {
    const port = new IInformeFinalRepository();
    await expect(port.registrar({})).rejects.toThrow('no implementado');
    await expect(port.listarPorHistoria('x')).rejects.toThrow(
      'no implementado'
    );
    await expect(port.obtenerPorId('x')).rejects.toThrow('no implementado');
    await expect(port.actualizarEstado('x', 'y')).rejects.toThrow(
      'no implementado'
    );
  });
});
