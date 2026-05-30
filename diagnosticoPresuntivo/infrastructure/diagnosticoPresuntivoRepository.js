import { randomUUID } from 'crypto';
import { IDiagnosticoPresuntivoRepository } from '../domain/diagnosticoPresuntivoDomain.js';
import pool from '../../db/db.js';

class DiagnosticoPresuntivoRepository extends IDiagnosticoPresuntivoRepository {
  async consultarPorHistoria(idHistory) {
    const id = String(idHistory || '');
    if (!id) {
      return { descripcion: '' };
    }
    const orderBy =
      pool.dialect === 'mysql'
        ? 'ORDER BY fecha DESC LIMIT 1'
        : 'ORDER BY fecha DESC NULLS LAST LIMIT 1';
    const result = await pool.query(
      `SELECT descripcion FROM diagnostico WHERE id_historia = $1 AND tipo = 'presuntivo' ${orderBy}`,
      [id]
    );
    if (!result.rows[0]) {
      return { descripcion: '' };
    }
    return { descripcion: result.rows[0].descripcion || '' };
  }

  async actualizarDiagnosticoPresuntivo(aggregateOrObj) {
    const params =
      aggregateOrObj && typeof aggregateOrObj.obtenerParametros === 'function'
        ? aggregateOrObj.obtenerParametros()
        : [
            aggregateOrObj?.idHistory,
            aggregateOrObj?.descripcion,
            aggregateOrObj?.idUsuario,
          ];
    const [idHistory, descripcion, idUsuario] = params;
    await pool.query(
      `INSERT INTO diagnostico (id_diagnostico, id_historia, tipo, descripcion, fecha)
       VALUES ($1, $2, 'presuntivo', $3, CURRENT_DATE)`,
      [randomUUID(), idHistory, descripcion]
    );
    return true;
  }
}

export { DiagnosticoPresuntivoRepository };
