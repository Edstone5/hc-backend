# ADR-0034 — Validación contra la NTS N° 188-MINSA/DGIESP-2022 oficial y corrección del símbolo de diastema

- **Estado:** Aceptado
- **Fecha:** 2026-06-01
- **Rama:** `feature/odontograma-nts150` (hc-frontend)
- **Ámbito:** `hc-frontend` (`hooks/odotools.js`, `pages/hc/ExamenFisico/odotools.jsx`)
- **Relacionado:** ADR-0029/0033 (exclusiones y desfase). Sustituye la nota de
  fuente "provisional" de ADR-0033 por la verificación con el PDF oficial.

## Contexto

El usuario entregó los PDFs oficiales y pidió **cotejar, verificar, validar e
implementar de ser necesario**:

- `Normativas/DGIESP-2022.pdf` → **NTS N° 188-MINSA/DGIESP-2022** (vigente).
- `Normativas/Norma-Tecnica-del-Odontograma.pdf` → norma anterior (base legal
  RM 776-2004), color mayormente azul; **superada** por la NTS-188.

El PDF de la NTS-188 está **escaneado** (sin capa de texto). Como el entorno no
tiene `pdftoppm`/Ghostscript/Tesseract y `choco` requiere admin, se habilitó `pip`
con `ensurepip` y se instaló **PyMuPDF (`--user`)** para rasterizar las 24 páginas
a PNG y leerlas. Así se verificó la simbología directamente de la fuente oficial.

## Hallazgos de la validación (NTS-188 §5–§6)

Confirmado **conforme** en el proyecto:

- **§5.12–5.13 Colores:** azul = buen estado/no patológico, rojo = mal estado,
  temporal o patológico. → coincide con el selector de color del panel.
- **§5.16:** una pieza **puede** presentar más de un hallazgo (se registran en los
  recuadros superior/inferior). → respalda la matriz **conservadora** (no
  sobre-bloquear) de ADR-0033.
- **§6.1.11 Fusión** = 2 circunferencias interceptadas sobre 2 piezas; **§6.1.12
  Geminación** = 1 circunferencia sobre 1 pieza. → el proyecto dibuja germinación
  con 1 círculo y fusión sobre 2 dientes (ADR-0029): **correcto y bien
  diferenciado**.
- **§6.1.20 Pieza ausente** = aspa + DNE/DEX/DAO (`addMissingTooth` dibuja aspa).
- **§6.1.21 Pieza en clavija** = triángulo (`addPegTooth` dibuja triángulo). Además
  confirma que la clavija SÍ pertenece a la NTS-188 → su inclusión en el grupo de
  exclusión tamaño/forma (ADR-0033) es válida.
- Siglas y representación de Corona (CM/CF/CMC/CV/CLM), Macrodoncia (MAC),
  Microdoncia (MIC), Implante (IMP), Impactación (I), Ectópica (E), Movilidad (M),
  Pulpotomía (PP), FFP, Edéntulo, PPF/PPR/PDC, DDE (O/PE/Fluorosis): **coinciden**.

La matriz de exclusiones (Ausencia; Doble formación F/G; Giroversión D/I; Corona
única; Tamaño/forma MAC/MIC/PC) queda **validada**: ninguna contradice la norma y
todas corresponden a combinaciones clínicamente imposibles.

## Decisión (implementación necesaria)

**Símbolo de diastema corregido.** La NTS-188 **§6.1.6** define la diastema como
**"paréntesis invertido" )(** entre las dos piezas; el proyecto dibujaba una **X**
(scribble). Se reescribe `addDiastemaAtPoint` para dibujar dos arcos `)(` (paths
cuádricos con las panzas enfrentadas) y se elimina el helper `makeScribblePolyline
Points` (quedaba huérfano). Se actualizan los textos del panel/hook que mencionaban
la "X".

## Discrepancias menores registradas (no implementadas — decisión del equipo)

- **§6.1.4 Corona temporal**: la norma usa un **cuadrado** que encierra la pieza; el
  proyecto la dibuja vía `addCrown` (forma de corona). La sigla **CT** y el color
  (rojo, por ser temporal §5.12) sí son correctos. Cambiar la forma implica tocar
  `addCrown` (compartido); se deja como mejora visual opcional.
- **§6.1.16 Caries**: la norma subclasifica MB/CE/CD/CDP; el proyecto usa `C`.
- **Hallazgos NTS-188 aún no implementados** (completitud, fuera de alcance): espigo
  muñón, remanente radicular, supernumeraria, pieza en erupción/extruida/intruida,
  posición anormal (M/D/V/P/L), superficie desgastada, sellante, tratamiento de
  conductos (TC/PC), migración.

## Verificación (Norma de Oro)

- `npx eslint src` → 0 errores · `npx vite build` → OK · `npm run test:run` → 136.
- Manual: aplicar diastema → se dibuja )( entre las piezas (ya no una X).

## Fuentes

- **NTS N° 188-MINSA/DGIESP-2022** — Norma Técnica de Salud para el Uso del
  Odontograma (PDF oficial entregado; rasterizado y leído página por página).
- Norma Técnica del Odontograma (norma anterior, RM 776-2004) — referencia
  histórica.
