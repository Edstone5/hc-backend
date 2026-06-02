# ADR-0036 — Restauración por material (NTS-188 §6.1.33)

- **Estado:** Aceptado
- **Fecha:** 2026-06-01
- **Rama:** `feature/odontograma-nts150`
- **Ámbito:** `hc-backend` (catálogo de dominio) y `hc-frontend` (catálogo espejo + panel)
- **Relacionado:** ADR-0034/0035 (validación e implementación NTS-188). Cierra la
  «discrepancia menor» de restauración por material que quedó pendiente.

## Contexto

La NTS N° 188-MINSA/DGIESP-2022 (§6.1.33, _Restauración definitiva_) — verificada
contra la norma oficial, ver más abajo — indica que la restauración se dibuja
pintando de **azul** las superficies comprometidas y anotando en el recuadro la
**sigla del material** en mayúsculas y azul:

- **AM** = Amalgama
- **R** = Resina
- **IV** = Ionómero de Vidrio
- **IM** = Incrustación Metálica
- **IE** = Incrustación Estética

La _Restauración temporal_ (§6.1.34) se grafica con el **contorno en rojo**.

El proyecto solo tenía códigos legados de «obturación» (`O` amalgama, `R` resina,
`Io` ionómero) y el panel ni siquiera ofrecía aplicarlos. Faltaba la nomenclatura
exacta de la norma y las incrustaciones (IM/IE) y la restauración temporal (RT).

> **Fuente verificada:** `Normativas/Norma-Tecnica-del-Odontograma.pdf` §1.28
> (legible vía `pdftotext`): «…anotará las siglas del tipo de material empleado…
> Amalgama = AM, Resina = R, Ionómero de Vidrio = IV, Incrustación Metálica = IM,
> Incrustación Estética = IE». §1.29 Restauración temporal = contorno en rojo. La
> NTS-188 (DGIESP-2022, escaneada) mantiene esta nomenclatura.

## Decisión

### Catálogo (dominio + espejo cliente)

Se añaden a `odontograma/domain/hallazgosCatalogo.js` y a
`hc-frontend/.../hallazgosOdonto.js`:

- **AM** (amalgama), **IV** (ionómero de vidrio), **IM** (incrustación metálica),
  **IE** (incrustación estética) — `estado: 'bueno'` (azul). `R` ya existía.
- **RT** restauración temporal — `estado: 'malo'` (rojo).
- `CLASE_CPOD`: **AM/IV/IM/IE → obturado** (suman al componente «O» del CPO-D, como
  ya lo hacía R). **RT NO se cuenta** (provisional, no definitiva).

Los códigos legados `O` (amalgama) y `Io` (ionómero) **se conservan** para no romper
datos ya guardados ni los scripts de seed (`seed-reporte-odontograma.mjs` usa `O`).

### Panel (`pages/hc/ExamenFisico/odotools.jsx`)

Nuevo desplegable **«40. Restauración ▾»** en la sección 7 con:

- Definitiva (azul): AM / R / IV / IM / IE.
- Temporal (rojo): RT.

Handler `onRestauracion(sigla, nombre, color)` → `aplicarSigla` → `track`
(exclusión + registro + desfase visual). La sigla se escribe en el recuadro del
diente conforme a la norma.

### Exclusión añadida (`grupoDe`)

Grupo **`restauración`**: AM/R/IV/IM/IE/RT mutuamente excluyentes (una restauración
por pieza en el registro por-sigla). El regex prioriza las siglas multi-carácter
(AM/IV/IM/IE/RT) antes que `R` para no capturarla parcialmente.

## Consecuencias

- El odontograma usa la nomenclatura de material exacta de la NTS-188; las
  restauraciones definitivas alimentan el componente obturado del CPO-D.
- Cambios aditivos: no se alteran códigos ni comportamientos existentes; `O`/`Io`
  siguen siendo válidos como legados.

## Limitación conocida

- El editor es **por sigla** (no tiene superficies rellenables), por lo que se
  escribe la sigla del material en lugar de «pintar de azul las superficies». Es la
  aproximación realista posible con el modelo actual; migrar a pintado por cara
  queda como mejora futura (requeriría rediseñar el SVG del diente con caras
  clicables).

## Verificación (Norma de Oro)

- Backend `npm test` → **1468 passing** (catálogo aditivo, sin regresiones).
- Frontend `npx eslint src` 0 errores · `npx vite build` OK · `npm run test:run`
  → **136 passing**.
