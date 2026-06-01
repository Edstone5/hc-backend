import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agregarReporteOdontograma } from '../odontograma/domain/odontogramaDomain.js';

// ── Función pura de agregación (RF-12) ───────────────────────────────────────
describe('agregarReporteOdontograma', () => {
  it('devuelve ceros con lista vacía', () => {
    const r = agregarReporteOdontograma([]);
    expect(r.totalPacientes).toBe(0);
    expect(r.totalEntradas).toBe(0);
    expect(r.caries.prevalencia).toBe(0);
    expect(r.cpod.promedio).toBe(0);
    expect(r.porDiente).toEqual([]);
  });

  it('tolera entrada no-array', () => {
    const r = agregarReporteOdontograma(null);
    expect(r.totalPacientes).toBe(0);
  });

  it('cuenta pacientes distintos por id_historia', () => {
    const r = agregarReporteOdontograma([
      { id_historia: 'h1', numero_diente: 16, codigo_hallazgo: 'C' },
      { id_historia: 'h1', numero_diente: 26, codigo_hallazgo: 'O' },
      { id_historia: 'h2', numero_diente: 36, codigo_hallazgo: 'R' },
    ]);
    expect(r.totalPacientes).toBe(2);
    expect(r.totalEntradas).toBe(3);
  });

  it('prevalencia de caries a nivel paciente', () => {
    // h1 y h3 tienen caries; h2 no → 2/3
    const r = agregarReporteOdontograma([
      { id_historia: 'h1', numero_diente: 16, codigo_hallazgo: 'C' },
      { id_historia: 'h2', numero_diente: 26, codigo_hallazgo: 'O' },
      { id_historia: 'h3', numero_diente: 36, codigo_hallazgo: 'C' },
    ]);
    expect(r.caries.pacientesConCaries).toBe(2);
    expect(r.caries.prevalencia).toBeCloseTo(2 / 3, 5);
  });

  it('CPO-D cuenta cada diente una sola vez por paciente', () => {
    // h1: caries en 16 (dos registros = un diente) + obturado 26 → CPO-D = 2
    const r = agregarReporteOdontograma([
      { id_historia: 'h1', numero_diente: 16, codigo_hallazgo: 'C' },
      { id_historia: 'h1', numero_diente: 16, codigo_hallazgo: 'C' },
      { id_historia: 'h1', numero_diente: 26, codigo_hallazgo: 'O' },
    ]);
    expect(r.cpod.componentes).toEqual({
      cariado: 1,
      perdido: 0,
      obturado: 1,
    });
    expect(r.cpod.promedio).toBeCloseTo(2, 5); // 1 paciente
  });

  it('clasifica perdido (DEX) y obturado (O/R/Io)', () => {
    const r = agregarReporteOdontograma([
      { id_historia: 'h1', numero_diente: 16, codigo_hallazgo: 'DEX' },
      { id_historia: 'h1', numero_diente: 26, codigo_hallazgo: 'Io' },
    ]);
    expect(r.cpod.componentes).toEqual({
      cariado: 0,
      perdido: 1,
      obturado: 1,
    });
    expect(r.caries.pacientesConCaries).toBe(0);
  });

  it('ignora códigos sin clase CPO-D y nulos', () => {
    const r = agregarReporteOdontograma([
      { id_historia: 'h1', numero_diente: 16, codigo_hallazgo: 'GV-D' },
      { id_historia: 'h1', numero_diente: 26, codigo_hallazgo: null },
    ]);
    expect(r.totalPacientes).toBe(1); // el paciente existe
    expect(r.cpod.promedio).toBe(0); // pero sin componentes CPO-D
  });

  it('porDiente agrega caries por pieza FDI ordenado', () => {
    const r = agregarReporteOdontograma([
      { id_historia: 'h1', numero_diente: 36, codigo_hallazgo: 'C' },
      { id_historia: 'h2', numero_diente: 16, codigo_hallazgo: 'C' },
      { id_historia: 'h3', numero_diente: 16, codigo_hallazgo: 'C' },
    ]);
    expect(r.porDiente).toEqual([
      { diente: 16, pacientesConCaries: 2, prevalencia: 2 / 3 },
      { diente: 36, pacientesConCaries: 1, prevalencia: 1 / 3 },
    ]);
  });
});

// ── Controlador: ruta de reporte ─────────────────────────────────────────────
const listarEntradasParaReporte = vi.fn();
vi.mock('../odontograma/infrastructure/odontogramaRepository.js', () => ({
  OdontogramaRepository: class {
    listarEntradasParaReporte(...a) {
      return listarEntradasParaReporte(...a);
    }
  },
}));

const { OdontogramaController } = await import(
  '../odontograma/application/odontogramaController.js'
);

describe('OdontogramaController.reportePrevalencia', () => {
  let req, res;
  beforeEach(() => {
    req = { query: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it('responde 200 con el reporte agregado', async () => {
    listarEntradasParaReporte.mockResolvedValue([
      { id_historia: 'h1', numero_diente: 16, codigo_hallazgo: 'C' },
    ]);
    await OdontogramaController.reportePrevalencia(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.totalPacientes).toBe(1);
    expect(payload.caries.pacientesConCaries).toBe(1);
  });

  it('pasa los filtros normalizados al repositorio (tipo en mayúsculas)', async () => {
    listarEntradasParaReporte.mockResolvedValue([]);
    req.query = { tipo: 'inicial', alumno: 'Ana', desde: '2026-01-01' };
    await OdontogramaController.reportePrevalencia(req, res);
    expect(listarEntradasParaReporte).toHaveBeenCalledWith({
      tipo: 'INICIAL',
      alumno: 'Ana',
      desde: '2026-01-01',
      hasta: null,
    });
  });

  it('responde 500 si el repositorio falla', async () => {
    listarEntradasParaReporte.mockRejectedValue(new Error('db caída'));
    await OdontogramaController.reportePrevalencia(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
