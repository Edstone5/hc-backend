import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validarExclusionAusencia,
  validarExclusion,
  CODIGOS_AUSENCIA,
  GRUPOS_EXCLUSION_MUTUA,
  OdontogramaEntradaAggregate,
} from '../odontograma/domain/odontogramaDomain.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// ── Función pura de exclusión por ausencia ───────────────────────────────────
describe('validarExclusionAusencia', () => {
  it('permite si no hay hallazgos previos', () => {
    expect(validarExclusionAusencia('C', []).ok).toBe(true);
  });

  it('permite agregar un hallazgo si la pieza no está ausente', () => {
    expect(validarExclusionAusencia('O', ['C', 'R']).ok).toBe(true);
  });

  it('bloquea agregar un hallazgo sobre una pieza ausente (DEX)', () => {
    const r = validarExclusionAusencia('C', ['DEX']);
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/ausente/i);
  });

  it('bloquea también con código nuevo nulo (texto libre) sobre pieza ausente', () => {
    expect(validarExclusionAusencia(null, ['DNE']).ok).toBe(false);
  });

  it('permite registrar una ausencia adicional sobre pieza ya ausente', () => {
    expect(validarExclusionAusencia('DNE', ['DEX']).ok).toBe(true);
  });

  it('CODIGOS_AUSENCIA contiene DNE, DEX, DAO', () => {
    expect([...CODIGOS_AUSENCIA].sort()).toEqual(['DAO', 'DEX', 'DNE']);
  });
});

// ── Matriz de exclusión mutua (validarExclusion) ─────────────────────────────
describe('validarExclusion (matriz)', () => {
  it('incluye la regla de ausencia', () => {
    expect(validarExclusion('C', ['DEX']).ok).toBe(false);
  });

  it('bloquea macrodoncia + microdoncia en la misma pieza', () => {
    const r = validarExclusion('MIC', ['MAC']);
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/tamaño/i);
  });

  it('bloquea giroversión derecha + izquierda', () => {
    expect(validarExclusion('GV-I', ['GV-D']).ok).toBe(false);
  });

  it('bloquea dos coronas totales distintas (Co + Cv)', () => {
    const r = validarExclusion('Cv', ['Co']);
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/corona/i);
  });

  it('permite repetir el mismo código del grupo (no es contradictorio)', () => {
    expect(validarExclusion('Co', ['Co']).ok).toBe(true);
  });

  it('permite combinaciones de grupos distintos (caries + corona)', () => {
    expect(validarExclusion('Co', ['C']).ok).toBe(true);
  });

  it('GRUPOS_EXCLUSION_MUTUA define tamaño, giroversión y corona', () => {
    const nombres = GRUPOS_EXCLUSION_MUTUA.map((g) => g.nombre).sort();
    expect(nombres).toEqual(['corona', 'giroversión', 'tamaño']);
  });
});

// ── Getters públicos del aggregate ───────────────────────────────────────────
describe('OdontogramaEntradaAggregate getters', () => {
  it('expone numeroDiente, tipo y codigoHallazgo', () => {
    const agg = new OdontogramaEntradaAggregate({
      idHistoria: VALID_UUID,
      numeroDiente: 16,
      tipo: 'inicial',
      codigoHallazgo: 'C',
    });
    expect(agg.numeroDiente).toBe(16);
    expect(agg.tipo).toBe('INICIAL');
    expect(agg.codigoHallazgo).toBe('C');
  });
});

// ── Controlador: ruta 409 por exclusión ──────────────────────────────────────
const listarPorHistoria = vi.fn();
const registrarEntrada = vi.fn();
vi.mock('../odontograma/infrastructure/odontogramaRepository.js', () => ({
  OdontogramaRepository: class {
    listarPorHistoria(...a) {
      return listarPorHistoria(...a);
    }
    registrarEntrada(...a) {
      return registrarEntrada(...a);
    }
  },
}));

const { OdontogramaController } = await import(
  '../odontograma/application/odontogramaController.js'
);

describe('OdontogramaController.registrar (exclusión)', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { id: VALID_UUID },
      body: { numeroDiente: 16, tipo: 'INICIAL', codigoHallazgo: 'C' },
      user: { id: VALID_UUID },
    };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it('devuelve 409 si la pieza ya está marcada como ausente', async () => {
    listarPorHistoria.mockResolvedValue([
      { numero_diente: 16, tipo: 'INICIAL', codigo_hallazgo: 'DEX' },
    ]);
    await OdontogramaController.registrar(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(registrarEntrada).not.toHaveBeenCalled();
  });

  it('registra (201) si no hay conflicto de ausencia', async () => {
    listarPorHistoria.mockResolvedValue([
      { numero_diente: 25, tipo: 'INICIAL', codigo_hallazgo: 'DEX' }, // otra pieza
    ]);
    registrarEntrada.mockResolvedValue(true);
    await OdontogramaController.registrar(req, res);
    expect(registrarEntrada).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('no aplica la exclusión entre tipos distintos (INICIAL vs EVOLUCION)', async () => {
    listarPorHistoria.mockResolvedValue([
      { numero_diente: 16, tipo: 'EVOLUCION', codigo_hallazgo: 'DEX' },
    ]);
    registrarEntrada.mockResolvedValue(true);
    await OdontogramaController.registrar(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
