# ADR-0038 — Fix: flechas de intrusión/extrusión según NTS-188 §6.1.24/6.1.25

- **Estado:** Aceptado
- **Fecha:** 2026-06-02
- **Rama:** `feature/odontograma-nts150`
- **Ámbito:** `hc-frontend` (`hooks/odotools.js`, `drawToothArrow` + arrows)
- **Relacionado:** ADR-0035 (introdujo las flechas)
- **Origen:** Barrido visual de cada tratamiento × cada pieza (52 piezas) + cotejo
  contra el PDF oficial NTS N° 188-MINSA/DGIESP-2022 (figuras §6.1.24/§6.1.25).

## Contexto

El barrido funcional confirmó que las 18 funciones de dibujo por pieza operan en
las 52 piezas sin errores. Al cotejar la simbología contra las figuras oficiales se
detectó una **incongruencia en la flecha de intrusión**.

Las figuras oficiales muestran que **tanto extrusión como intrusión** se dibujan
**fuera del borde oclusal/incisal**, distinguiéndose por el **sentido** de la punta:

- **Extruida (§6.1.24):** flecha recta fuera del borde oclusal, apuntando **hacia
  afuera** (alejándose del diente — sobre-erupción).
- **Intruida (§6.1.25):** flecha recta fuera del borde oclusal, apuntando **hacia el
  diente** (sentido apical/intrusivo).

La implementación previa dibujaba la intrusión en el **lado apical** de la pieza
(punta hacia el ápice por fuera de la raíz), en lugar del lado oclusal apuntando
hacia adentro. La extrusión, además, quedaba pegada al borde en vez de claramente
por fuera.

## Decisión

Se reescribió `drawToothArrow` con un parámetro `mode` (`eruption` | `extrusion` |
`intrusion`) en lugar de `headAt`:

- `extrusion`: `tail = occlusalY`, `tip = occlusalY + outward·len` → punta hacia
  afuera, por fuera del borde oclusal.
- `intrusion`: `tail = occlusalY + outward·len`, `tip = occlusalY` → punta en el
  borde oclusal apuntando hacia el diente (apical).
- `eruption`: zig-zag desde el interior de la corona hacia el borde oclusal (sin
  cambios de comportamiento).

`outward = upper ? +1 : -1` orienta correctamente según arcada (superior/inferior),
de modo que el sentido se invierte de forma coherente en los 4 cuadrantes y en los
dientes deciduos (cuadrantes 5–8).

## Verificación

- **Geométrica (navegador, hook):** 1.6 (superior) y 4.6 (inferior): extrusión con
  punta por fuera del borde oclusal apuntando hacia afuera; intrusión con punta en
  el borde oclusal apuntando hacia el diente. Sentido invertido correctamente entre
  arcadas.
- **Barrido:** erupción/extrusión/intrusión dibujan en las **52 piezas** sin
  excepciones ni dibujos vacíos.
- Norma de Oro: frontend `eslint src` 0 · `vite build` OK · `test:run` **136**.
  Backend sin cambios (**1468**).

## Validación de simbología (resto, sin cambios necesarios)

Cotejado contra el PDF oficial NTS-188; **conformes** sin cambios: corona y corona
temporal = cuadrado azul/rojo (§6.1.3/6.1.4); pieza ausente = aspa azul + sigla
DNE/DEX/DAO (§6.1.20); clavija = triángulo (§6.1.21); ectópica «E», macrodoncia
«MAC», microdoncia «MIC», movilidad «M#»; fusión = 2 circunferencias / geminación =
1 (§6.1.11/6.1.12); espigo muñón = línea de raíz + cuadrado (§6.1.8); supernumeraria
= «S» en circunferencia apical (§6.1.26); pulpotomía «PP» (§6.1.27); posición
M/D/V/P/L (§6.1.28); caries MB/CE/CD/CDP (§6.1.16); restauración AM/R/IV/IM/IE
(§6.1.33) y temporal RT (§6.1.34); RR (§6.1.32); sellante «S» (§6.1.35); superficie
desgastada «DES» (§6.1.36); endodoncia «TC»/«PC» con línea vertical (§6.1.37);
diástema = paréntesis invertido «)(» (§6.1.6).

Limitaciones conocidas (sigla en vez de pintado por superficie): restauración por
material y superficie desgastada; «C: Carilla» de §6.1.33 se cubre con el código
existente `Cf`. Quedan como mejora futura (requiere caras clicables en el SVG).
