/**
 * Siembra entradas de odontograma (odontograma_entrada) sobre historias YA
 * existentes, para poder probar el dashboard RF-12 (Reportes de Odontograma) y
 * la exportación CSV con datos reales.
 *
 * Idempotente: borra primero las entradas marcadas con diagnostico='SEED-RF12'
 * antes de volver a insertarlas, así puede ejecutarse varias veces.
 *
 * Limpieza:  node db/seed-reporte-odontograma.mjs --clean
 *
 * Hallazgos usados (clasificación CPO-D en hallazgosCatalogo.js):
 *   C = cariado · DEX = perdido · O/R/Io = obturado
 */
import { randomUUID } from 'crypto';
import pool from './db.js';

const SEED_TAG = 'SEED-RF12';
const N_HISTORIAS = 15;

// Pool de hallazgos con su frecuencia relativa (más caries para prevalencia alta).
const HALLAZGOS = ['C', 'C', 'C', 'O', 'O', 'R', 'DEX', 'Io'];
// Dientes FDI permanentes posteriores (más propensos a caries) + algunos anteriores.
const DIENTES = [
  16, 26, 36, 46, 17, 27, 37, 47, 14, 24, 34, 44, 11, 21, 31, 41, 18, 28,
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function clean() {
  const r = await pool.query(
    'DELETE FROM odontograma_entrada WHERE diagnostico = $1',
    [SEED_TAG]
  );
  console.log(`🧹 Entradas SEED-RF12 eliminadas: ${r.rowCount ?? 0}`);
}

async function main() {
  if (process.argv.includes('--clean')) {
    await clean();
    return;
  }

  // Reinicio idempotente.
  await clean();

  const historias = await pool.query(
    `SELECT h.id_historia, h.id_estudiante, u.nombre, u.apellido
       FROM historia_clinica h
       JOIN usuario u ON u.id_usuario = h.id_estudiante
      ORDER BY h.fecha_elaboracion DESC
      LIMIT $1`,
    [N_HISTORIAS]
  );

  if (historias.rows.length === 0) {
    console.error('✖ No hay historias clínicas para sembrar.');
    return;
  }

  let totalEntradas = 0;
  let conCaries = 0;

  for (const h of historias.rows) {
    const alumno = `${h.nombre ?? ''} ${h.apellido ?? ''}`.trim();
    // Entre 2 y 6 dientes con hallazgo por historia, sin repetir diente.
    const nEntradas = 2 + Math.floor(Math.random() * 5);
    const dientesUsados = new Set();
    let historiaTieneCaries = false;

    for (let i = 0; i < nEntradas; i++) {
      let diente = pick(DIENTES);
      let intentos = 0;
      while (dientesUsados.has(diente) && intentos < 10) {
        diente = pick(DIENTES);
        intentos++;
      }
      dientesUsados.add(diente);

      const codigo = pick(HALLAZGOS);
      if (codigo === 'C') historiaTieneCaries = true;

      await pool.query(
        `INSERT INTO odontograma_entrada
           (id_entrada, id_historia, numero_diente, diagnostico, fecha, alumno, tipo, codigo_hallazgo, id_usuario)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'INICIAL', $6, $7)`,
        [
          randomUUID(),
          h.id_historia,
          diente,
          SEED_TAG,
          alumno || null,
          codigo,
          h.id_estudiante,
        ]
      );
      totalEntradas++;
    }
    if (historiaTieneCaries) conCaries++;
  }

  console.log(
    `✔ Sembradas ${totalEntradas} entradas en ${historias.rows.length} historias ` +
      `(${conCaries} con al menos una caries).`
  );
  console.log(
    '   Abre el dashboard: Admin → Reporte Odontograma (tipo INICIAL) y prueba "Exportar CSV".'
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('✖ Error:', e.message);
    process.exit(1);
  });
