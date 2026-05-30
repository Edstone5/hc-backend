import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['test/setup.js'],
    coverage: {
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      // Se excluye la capa de infraestructura porque sus repositorios
      // dependen de un servidor MySQL real y no pueden probarse en unitario
      // puro sin levantar un contenedor (Hexagonal Architecture — ADR-0003).
      // La cobertura se mide sobre dominio + aplicación, que es donde vive
      // la lógica de negocio.
      exclude: [
        'node_modules/',
        'test/',
        '**/infrastructure/**',
        'db/',
        'controllers/',
        'models/',
      ],
    },
  },
});
