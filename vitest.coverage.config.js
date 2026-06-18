import { defineConfig } from 'vitest/config';

/**
 * Quality Gate de cobertura (Laboratorio Dual, Fase 3).
 *
 * El pipeline FALLA automáticamente si la cobertura de la lógica de negocio
 * (capa de dominio del núcleo clínico) cae por debajo del 80 % de líneas.
 *
 * Se acota a los módulos de DOMINIO con prueba unitaria (mismos del mutation
 * testing) porque ahí vive la lógica de negocio: la capa de infraestructura se
 * excluye por depender de servicios reales (Hexagonal Architecture — ADR-0003).
 *
 * Uso: npm run test:cov
 */
export default defineConfig({
  test: {
    setupFiles: ['test/setup.js'],
    coverage: {
      provider: 'v8',
      all: true,
      include: [
        'filiacion/domain/filiacionDomain.js',
        'enfermedadActual/domain/enfermedadActualDomain.js',
        'motivoConsulta/domain/motivoConsultaDomain.js',
        'antecedente/domain/antecedenteDomain.js',
        'examenGeneral/domain/examenGeneralDomain.js',
        'examenBoca/domain/examenBocaDomain.js',
        'examenRegional/domain/examenRegionalDomain.js',
        'higieneBocal/domain/higieneBocalDomain.js',
        'hc/domain/hcDomain.js',
        'evolucion/domain/evolucionDomain.js',
        'diagnosticoPresuntivo/domain/diagnosticoPresuntivoDomain.js',
        'derivacionClinicas/domain/derivacionClinicasDomain.js',
        'diagnosticoClinicas/domain/diagnosticoClinicasDomain.js',
        'auth/domain/authDomain.js',
        'user/domain/userDomain.js',
        'patient/domain/patientDomain.js',
        'catalogo/domain/catalogoDomain.js',
        'studentUsers/domain/studentUsersDomain.js',
        'listaHcAdultos/domain/listaHcAdultosDomain.js',
      ],
      reporter: ['text', 'text-summary'],
      // Quality gate: el comando devuelve código de salida ≠ 0 (rojo en CI)
      // si la cobertura baja del umbral. Líneas = métrica principal de la guía.
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 80,
      },
    },
  },
});
