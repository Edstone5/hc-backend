/**
 * Lab07 — Análisis de Mutación (Stryker) · Desafío de Valores Límite (BVA).
 *
 * Dominio puro (Clean Architecture): sin dependencias de infraestructura, por lo
 * que el análisis de mutación es rápido y aislado (Martin, 2018).
 *
 * Regla de negocio:
 *   "El envío es gratis SOLO si el subtotal es estrictamente mayor a $100.00".
 *
 * El operador relacional `>` es el punto sensible: un mutante ROR (`>` → `>=`)
 * cambia la frontera de "estrictamente mayor" a "mayor o igual", introduciendo un
 * defecto silencioso en el límite exacto (100.00).
 */
export function isEligibleForFreeShipping(subtotal) {
  return subtotal > 100.0;
}
