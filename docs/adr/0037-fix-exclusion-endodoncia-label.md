# ADR-0037 — Fix: exclusión de endodoncia no se aplicaba (label abreviado)

- **Estado:** Aceptado
- **Fecha:** 2026-06-02
- **Rama:** `feature/odontograma-nts150`
- **Ámbito:** `hc-frontend` (`pages/hc/ExamenFisico/odotools.jsx`, `grupoDe`)
- **Relacionado:** ADR-0035 (introdujo el grupo de exclusión «endodoncia»)
- **Origen:** Hallazgo de la **re-prueba manual en navegador** (guion
  `docs/PRUEBAS_MANUALES_ODONTOGRAMA.md`, caso 7.3).

## Contexto

Al re-probar la sección 7 en el navegador se detectó que aplicar **TC**
(tratamiento de conductos) y luego **PC** (pulpectomía) sobre la **misma** pieza
**NO** bloqueaba la segunda: se dibujaban dos líneas `root-canal` en el mismo
diente, violando la exclusión de endodoncia definida en ADR-0035.

### Causa raíz

El handler del panel registra el tratamiento con el label **abreviado**
`"Trat. de conductos (TC)"`, pero `grupoDe` clasificaba la endodoncia con el
regex `/tratamiento de conductos/i` (palabra completa). La abreviatura «Trat.» no
coincide → `grupoDe` devolvía `null` para TC → `validarExclusion` no encontraba
conflicto y permitía PC. (PC sí se clasificaba por `/pulpectom/i`, pero sin un TC
clasificado no había par que comparar.)

## Decisión

Detectar la endodoncia por la palabra **`conductos`** (presente tanto en el label
abreviado como en cualquier variante), en lugar de la frase completa:

```js
if (/conductos/i.test(label)) return { g: 'endodoncia', v: 'TC' };
if (/pulpectom/i.test(label)) return { g: 'endodoncia', v: 'PC' };
```

Es seguro: ningún otro tratamiento contiene «conductos», y la pieza en clavija
(que comparte la sigla PC) ya se clasifica antes por `/clavija/` → grupo
`tamaño/forma`, sin colisión.

## Verificación

- **Navegador (re-prueba):** TC en 4.7 y luego PC en 4.7 → ahora solo queda **1**
  línea `root-canal` y el recuadro conserva **TC**; PC queda bloqueado. ✅
- Se re-verificaron en navegador las demás exclusiones de la sección 7
  (caries-severidad MB↔CD, posición M↔D) y de restauración (AM↔IV): correctas.
- Norma de Oro: frontend `npx eslint src` 0 · `npx vite build` OK ·
  `npm run test:run` **136 passing**. Backend sin cambios (**1468 passing**).
