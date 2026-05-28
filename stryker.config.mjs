/**
 * Stryker mutation testing configuration.
 * Targets the 5 most important domain modules for mutation analysis.
 *
 * Run: npx stryker run
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
  mutate: [
    'filiacion/domain/filiacionDomain.js',
    'enfermedadActual/domain/enfermedadActualDomain.js',
    'motivoConsulta/domain/motivoConsultaDomain.js',
    'antecedente/domain/antecedenteDomain.js',
    'examenGeneral/domain/examenGeneralDomain.js',
  ],

  // ── Which test files cover the mutated sources ────────────────────────────
  testRunnerNodeArgs: [],
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
