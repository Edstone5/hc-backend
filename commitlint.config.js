/**
 * Configuración de commitlint — Conventional Commits.
 *
 * Se ejecuta automáticamente como hook `commit-msg` (Husky).
 * Bloquea commits que no sigan el formato:
 *   <type>(<scope>): <descripción>
 *
 * Scopes válidos para este proyecto HC-UNJBG.
 */
export default {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // Tipos permitidos (extiende los de config-conventional)
    'type-enum': [
      2,
      'always',
      [
        'feat', // nueva funcionalidad
        'fix', // corrección de bug
        'docs', // solo documentación
        'style', // formato, sin cambio funcional
        'refactor', // refactoring sin cambio funcional
        'test', // tests
        'chore', // tareas de mantenimiento, build
        'ci', // pipeline CI/CD
        'perf', // mejora de rendimiento
        'revert', // revertir un commit anterior
      ],
    ],

    // Scopes del proyecto
    'scope-enum': [
      1, // warn (no bloquea, solo avisa)
      'always',
      [
        // Módulos de dominio
        'auth',
        'user',
        'patient',
        'hc',
        'filiacion',
        'antecedente',
        'catalogo',
        'examen',
        'higiene',
        'diagnostico',
        'evolucion',
        'derivacion',
        'motivo-consulta',
        'enfermedad-actual',
        // Infraestructura
        'db',
        'docker',
        'ci',
        'metrics',
        'health',
        'swagger',
        'deps',
        'observability',
        'coverage',
        // Docs
        'docs',
        'adr',
        'scm',
        'slo',
        'sad',
        'changelog',
      ],
    ],

    // Primera letra en minúsculas
    'subject-case': [2, 'always', 'lower-case'],

    // Máximo 100 caracteres en el header
    'header-max-length': [2, 'always', 100],
    // Espacios al final del header solo emiten warning (no bloquean CI)
    'header-trim': [1, 'always'],

    // Footer optional (no bloquea si falta)
    'references-empty': [0, 'always'],
  },
};
