import { describe, it, expect } from 'vitest';
import { isEligibleForFreeShipping } from './envioGratis.js';

// ── FASE 1: Suite DÉBIL (100% branch coverage, pero NO mata al mutante ROR) ──
// Estas son las pruebas tal cual el escenario de la guía: cubren ambas ramas
// (true/false) pero NINGUNA prueba el valor de frontera (100.00), por lo que el
// mutante `>` → `>=` sobrevive.
describe('isEligibleForFreeShipping — suite débil (Fase 1)', () => {
  it('debe retornar true para montos grandes', () => {
    expect(isEligibleForFreeShipping(150.0)).toBe(true);
  });

  it('debe retornar false para montos pequeños', () => {
    expect(isEligibleForFreeShipping(50.0)).toBe(false);
  });
});

// ── FASE 2: Refactorización con Análisis de Valores Límite (BVA) ──────────────
// Caja negra: la frontera exacta de la regla es 100.00. Como la regla exige
// "estrictamente mayor", en 100.00 el resultado real es `false`; pero el mutante
// `>= ` daría `true`. Esta única prueba en la frontera MATA al mutante ROR.
describe('isEligibleForFreeShipping — frontera BVA (Fase 2, mata al mutante)', () => {
  it('debe retornar false cuando el subtotal es exactamente 100.00 (frontera)', () => {
    expect(isEligibleForFreeShipping(100.0)).toBe(false);
  });

  it('debe retornar true en el primer valor por encima de la frontera (100.01)', () => {
    expect(isEligibleForFreeShipping(100.01)).toBe(true);
  });
});
