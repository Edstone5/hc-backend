# ADR-0025 — Habilitar la suite Vitest del frontend con jsdom

- **Estado:** Aceptado
- **Fecha:** 2026-05-31
- **Rama:** `feature/odontograma-nts150` (hc-frontend)
- **Ámbito:** `hc-frontend` (tooling de tests; sin cambios de runtime de la app)
- **Relacionado:** checkpoint 30/05 (pendiente "instalar jsdom para correr la suite vitest del front")

## Contexto

`hc-frontend/vitest.config.js` ya declaraba `environment: 'jsdom'` y el proyecto
tenía `@testing-library/react` instalado, pero **`jsdom` no estaba en
`devDependencies`**. Como consecuencia, al correr `vitest` solo pasaba 1 archivo
(el único que no toca el DOM) y los otros 23 fallaban con:

```
Error: Cannot find package 'jsdom' imported from .../node_modules/vitest/...
ERR_MODULE_NOT_FOUND
```

Esto dejaba la suite del frontend efectivamente inutilizable y sin red de
seguridad para los hooks y componentes.

## Decisión

1. **Instalar `jsdom` como devDependency** (`npm install -D jsdom`).
2. **Corregir dos tests obsoletos** en `test/useHistoria.test.jsx`: esperaban
   `window.alert(...)`, pero los hooks `useCreateHistoriaClinica` y `useRegisterHc`
   ya notifican con `toast.success(...)` (react-hot-toast). Los tests estaban
   "ocultos" porque la suite completa nunca corría. Se mockea `react-hot-toast` y
   se verifica `toast.success` con el mensaje real de producción.
3. **Limpiar dos imports namespace sin usar** (`fetchPatients`, `fetchStudents`)
   en `test/usePatients.test.jsx` y `test/useStudents.test.jsx`, que disparaban
   `no-unused-vars` al incluir `test/` en el lint.
4. **Añadir un test de render del odontograma** (`test/odontogramaToolsPanel.test.jsx`):
   monta `OdontogramaToolsPanel` en jsdom y verifica las 6 secciones clínicas, los
   botones de Fusión/Germinación y el banner de diente seleccionado. Es el primer
   test de UI del módulo del odontograma.
5. **Añadir el script `test:run`** (`vitest run`) para ejecución única en CI /
   verificación, sin tocar `test` (modo watch).

## Consecuencias

- La suite del frontend corre completa: **25 archivos, 136 tests** en verde.
- Red de seguridad real para hooks de React Query, servicios `fetch*` y el panel
  del odontograma.
- Posibilita futuros tests de UI (p.ej. los bloqueos de exclusión clínica del
  panel, hoy solo verificados en el dominio backend).

## Verificación (Norma de Oro)

- `npm run test:run` → 25 archivos, 136 tests passing.
- `npx eslint src test` → 0 errores.
- `npx vite build` → OK.
- Backend sin cambios (suite sigue en 1454 passing).
