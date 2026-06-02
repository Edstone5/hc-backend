# ADR-0035 — Implementación de los hallazgos NTS-188 faltantes

- **Estado:** Aceptado
- **Fecha:** 2026-06-01
- **Rama:** `feature/odontograma-nts150`
- **Ámbito:** `hc-backend` (catálogo de dominio) y `hc-frontend` (hook + panel)
- **Relacionado:** ADR-0034 (validación NTS-188; estos hallazgos quedaban como
  pendientes de completitud)

## Contexto

La validación contra la NTS N° 188-MINSA/DGIESP-2022 (ADR-0034) confirmó que el
odontograma cumplía la norma en lo implementado, pero faltaban varios hallazgos del
catálogo oficial. Se decide completarlos para acercar el módulo a un entorno real y
cubrir la nomenclatura de la norma.

## Decisión

### Catálogo (dominio + espejo cliente)

Se añaden a `odontograma/domain/hallazgosCatalogo.js` y a su espejo
`hc-frontend/.../hallazgosOdonto.js` los códigos (con su `estado` azul/rojo):

- Caries por severidad (§6.1.16): **MB** (mancha blanca), **CE** (esmalte),
  **CD** (dentina), **CDP** (dentina + compromiso pulpar).
- **EM** espigo muñón (§6.1.8), **RR** remanente radicular (§6.1.32),
  **SUP** supernumeraria (§6.1.26), **SELL** sellante (§6.1.35),
  **ERU** erupción (§6.1.23), **EXT** extruida (§6.1.24), **INT** intruida
  (§6.1.25), **DES** superficie desgastada (§6.1.36), **TC** tratamiento de
  conductos y **PLPC** pulpectomía (§6.1.37), y posición anormal **POS-M/D/V/P/L**
  (§6.1.28).
- `CLASE_CPOD`: **CE/CD/CDP → cariado** (lesiones cavitadas cuentan para CPO-D; la
  mancha blanca MB es precavitacional y no se cuenta).

Códigos elegidos para evitar colisión con los existentes (p.ej. `PC` ya era _pieza
en clavija_, por lo que pulpectomía es `PLPC`; supernumeraria es `SUP` y sellante
`SELL` aunque ambos se grafiquen con la sigla «S»).

### Dibujo (hook `hooks/odotools.js`)

- `addSiglaHallazgo(diente, sigla, color)`: escribe el recuadro (input) y dibuja la
  etiqueta centrada con **desfase** (ADR-0033). Para MB/CE/CD/CDP, RR, DES,
  posición (M/D/V/P/L) y sellante.
- `addEruptionArrow` (zig-zag), `addExtrusionArrow` (recta → oclusal),
  `addIntrusionArrow` (recta → ápice): helper `drawToothArrow` que orienta la punta
  según el cuadrante (superiores con oclusal hacia abajo).
- `addSupernumerario`: «S» en circunferencia sobre la zona apical.
- `addEspigoMunon`: línea vertical en la raíz + cuadrado en la corona.
- `addRootCanalLine(diente, sigla, color)`: línea vertical en la raíz + sigla TC/PC.

### Panel (`pages/hc/ExamenFisico/odotools.jsx`)

Nueva **sección «7 · Otros hallazgos (NTS-188)»** con menús (Caries, Endodoncia,
Posición anormal) y botones (Espigo muñón, RR, Supernumeraria, Sellante, Superficie
desgastada, Erupción, Extruida, Intruida). Todo enruta por `track` (exclusión +
registro en «Tratamientos aplicados» + desfase visual).

### Exclusiones añadidas (`grupoDe`, conservadoras y por norma)

- **caries-severidad**: MB/CE/CD/CDP mutuamente excluyentes (una lesión, una
  severidad).
- **endodoncia**: TC ↔ PC (un tratamiento endodóntico por pieza).
- **posición**: M/D/V/P/L mutuamente excluyentes (una dirección anómala por pieza).

## Consecuencias

- El odontograma cubre la nomenclatura de la NTS-188; las nuevas siglas alimentan
  los reportes (las caries cavitadas suman al CPO-D).
- Cambios aditivos: no se alteran códigos ni comportamientos existentes.

## Discrepancias restantes (menores)

- El símbolo exacto de la restauración por material (AM/R/IV/IM/IE) §6.1.33 sigue
  usando los códigos previos (O/R/Io); la migración 1:1 a la nomenclatura de la
  norma queda como mejora futura.

## Verificación (Norma de Oro)

- Backend `npm test` → **1468 passing** (catálogo aditivo, sin regresiones).
- Frontend `npx eslint src` 0 errores · `npx vite build` OK · `npm run test:run`
  → **136 passing**.
