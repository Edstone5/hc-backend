import { describe, it, expect } from 'vitest';

// Cambio defectuoso DELIBERADO (Laboratorio Dual, Fase 4).
// Demuestra que la gobernanza (quality gate + branch protection) rechaza un PR
// que rompe las pruebas: el CI queda en rojo y el merge a main se bloquea.
// NO debe mergearse; este archivo se descarta tras la demostración.
describe('Simulación de cambio defectuoso (Fase 4)', () => {
  it('introduce un error que rompe la suite', () => {
    expect(true).toBe(false);
  });
});
