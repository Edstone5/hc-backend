# ADR-0018 — Mapeo diente→input determinista, fix de implante, selección por clic directo y contingencia INICIAL

**Fecha:** 2026-05-31
**Estado:** Aceptado
**Rama:** `feature/odontograma-nts150` (hc-frontend)

---

## Contexto

Durante la verificación en navegador surgieron cuatro problemas:

1. Al aplicar **cualquier corona** (CM, CT, etc.), **implante** o **FFP** sobre un diente
   deciduo (p.ej. **7.3**), la sigla aparecía **también en otro diente** (p.ej. **3.8**).
2. **Implantación** no mostraba marca visible sobre el diente.
3. La **selección** de diente se activaba al hacer clic _cerca_ de un diente (no solo
   sobre él), provocando selecciones accidentales.
4. Los botones 1 y 2 (aparatos de ortodoncia) no llevaban su número.

---

## Decisión

### Bug #1 — doble escritura del input por matcher geométrico

Causa raíz: las funciones del hook `addCrown`, `addImplant` y `addFosasFisurasProfundas`
escribían la sigla en el `<input>` del `foreignObject` **geométricamente más cercano**
al bbox del diente. Para dientes deciduos, ese bbox podía quedar más cerca del input de
otro diente (7.3 → input de 3.8). Como el panel **además** llamaba a `setInputForTooth`
(correcto), la sigla aparecía en **dos** dientes.

**Corrección:** nuevo helper `inputForToothDOM(svg, tooth)` que resuelve el input por
**orden del DOM** — en el SVG cada diente va seguido de su `<text>` y su `<foreignObject>`
(p.ej. `tooth_7_3` → `text` → `input34`). Es determinista y exacto. Se reemplazaron los
tres matchers geométricos por este helper. El matcher geométrico (con bug adicional de
espacio de coordenadas, usaba `fo.getCTM()` = CSS-pixel) queda eliminado.

### Bug #2 — implante invisible

El panel pasaba `color='#FFFFFF00'` (transparente) a `addImplant`/`addFosasFisurasProfundas`,
volviendo invisible la etiqueta dibujada sobre el diente. **Corrección:** pasar el color
real (azul/rojo según NTS-188).

### Bug #3 — selección por proximidad

`handleToothClick` (en `odonto.jsx`) seleccionaba el diente más cercano dentro de 120px.
**Corrección:** el clic debe caer **dentro del bounding box** de un diente para
seleccionarlo; si cae en el espacio vacío entre dientes, no selecciona nada. Si varios
bboxes contienen el punto (dientes contiguos solapados), gana el centro más cercano.
Nota: el criterio "más cercano" se conserva solo en los modos interactivos PPF/PPR/
transposición (ahí ayuda a conectar pilares), no en la selección del banner.

### Bug #4 — numeración

Los botones ahora muestran "1. Aparat. orto. fijo" y "2. Aparat. orto. removible".

### Contingencia EVOLUCIÓN → INICIAL (RF-06)

No puede existir un odontograma de **EVOLUCIÓN** sin una línea base **INICIAL**. Al
guardar (`saveOdontogramaVersion` en `odonto.jsx`): si el tipo activo es EVOLUCIÓN y el
paciente aún **no tiene INICIAL**, el guardado se promueve automáticamente a **INICIAL**
(con aviso informativo) y la UI se sincroniza. El INICIAL sigue siendo único por historia.

---

## Consecuencias

- Las siglas caen únicamente en el diente tratado, incluso deciduos.
- El implante muestra su etiqueta y registra el input en el diente correcto.
- La selección refleja exactamente el diente clicado (sin falsos positivos).
- El primer odontograma de un paciente siempre queda como INICIAL aunque el usuario
  haya dejado el selector en EVOLUCIÓN.

---

## Verificación

- `npx vite build` → OK; `npx eslint src` → 0 errores.
- Prueba manual confirmada por el usuario: CT/CM/IMP en 7.3 ya **no** marcan 3.8; el
  implante se ve; el aviso de "guardado como INICIAL" aparece al guardar evolución sin
  inicial previo.

> **Fuera de alcance (issue abierto):** al guardar el odontograma y al guardar en
> "Diagnóstico en clínicas" aparece un error "invalid token". Es transversal a varios
> módulos (no específico del odontograma) → se investiga como problema de
> autenticación/JWT en un cambio separado.
