/**
 * Stryker mutation testing configuration.
 * Targets all domain modules that have corresponding unit test coverage.
 *
 * Run: npx stryker run
 * Run (original 5 modules only): npx stryker run --mutate "filiacion/domain/filiacionDomain.js"
 *
 * @type {import('@stryker-mutator/core').PartialStrykerOptions}
 */
export default {
  // ── Test runner ───────────────────────────────────────────────────────────
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.js',
  },

  // ── Source files to mutate ────────────────────────────────────────────────
  // Módulos del núcleo clínico (alta cobertura de dominio)
  mutate: [
    // ── Lote original (ya probados) ───────────────────────────────────────
    'filiacion/domain/filiacionDomain.js',
    'enfermedadActual/domain/enfermedadActualDomain.js',
    'motivoConsulta/domain/motivoConsultaDomain.js',
    'antecedente/domain/antecedenteDomain.js',
    'examenGeneral/domain/examenGeneralDomain.js',

    // ── Módulos clínicos de examen (dominio puro) ─────────────────────────
    'examenBoca/domain/examenBocaDomain.js',
    'examenRegional/domain/examenRegionalDomain.js',
    'higieneBocal/domain/higieneBocalDomain.js',

    // ── HC y módulos clínicos de evolución / diagnóstico ──────────────────
    'hc/domain/hcDomain.js',
    'evolucion/domain/evolucionDomain.js',
    'diagnosticoPresuntivo/domain/diagnosticoPresuntivoDomain.js',
    'derivacionClinicas/domain/derivacionClinicasDomain.js',
    'diagnosticoClinicas/domain/diagnosticoClinicasDomain.js',

    // ── Módulos de soporte (auth, usuarios, paciente, catálogos) ──────────
    'auth/domain/authDomain.js',
    'user/domain/userDomain.js',
    'patient/domain/patientDomain.js',
    'catalogo/domain/catalogoDomain.js',
    'studentUsers/domain/studentUsersDomain.js',
    'listaHcAdultos/domain/listaHcAdultosDomain.js',
  ],

  // ── Coverage analysis por prueba (más rápido) ────────────────────────────
  coverageAnalysis: 'perTest',

  // ── Reporting ─────────────────────────────────────────────────────────────
  reporters: ['progress', 'html', 'clear-text'],
  htmlReporter: {
    fileName: 'reports/mutation/mutation.html',
  },

  // ── Quality gates ─────────────────────────────────────────────────────────
  thresholds: {
    high: 80,
    low: 60,
    break: 0,
  },

  // ── Performance ───────────────────────────────────────────────────────────
  concurrency: 4,
  timeoutMS: 10000,
  timeoutFactor: 1.5,
};
