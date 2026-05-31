# ADR-0020 — Modelo clínico del odontograma: multi-hallazgo por superficie y reglas de exclusión

**Fecha:** 2026-05-31
**Estado:** Aceptado
**Ramas:** `feature/odontograma-nts150` (hc-frontend)

---

## Contexto

Surgió la duda de base: ¿cuántos tratamientos puede llevar un diente en el
odontograma? ¿uno solo o varios? Esto define el modelo de datos y las validaciones
que debe cumplir la clínica odontológica de la UNJBG (IPRESS) según la normativa
peruana del SIHCE.

## Marco normativo (referencia)

- **NTS N° 188-MINSA/DGIESP-2022** (actualiza la NTS 150-2019): norma del odontograma
  dentro de la historia clínica estomatológica. Establece:
  - Dos odontogramas: **inicial** (ingreso) y de **evolución/control**.
  - Registro de hallazgos **por superficie** dentaria con nomenclatura/siglas oficiales.
  - **Código de color: ROJO = mal estado / patología / por tratar; AZUL = buen estado /
    tratamiento realizado.**
- **NTS N° 139-MINSA/2018**: gestión de la HC (trazabilidad, responsable, fecha).
- En el proyecto corresponde al **RF-06**.

> Los detalles por artículo (lista cerrada de siglas y exclusiones) deben contrastarse
> con el PDF oficial de la NTS 188; aquí se documenta el modelo general.

## Decisión (modelo clínico adoptado)

1. **La unidad de registro es la SUPERFICIE del diente, no el diente.** Un diente
   permanente tiene 5 superficies (vestibular, lingual/palatina, mesial, distal,
   oclusal/incisal). Por tanto **un diente admite múltiples hallazgos/tratamientos
   simultáneos** (p.ej. caries en oclusal + obturación en mesial).

2. **Dos categorías de hallazgo:**
   - **Por superficie** (caries, obturación, sellante, FFP): varios por diente.
   - **De diente completo** (corona total, pieza ausente, implante, movilidad,
     giroversión, edéntulo): aplican a todo el diente.

3. **Reglas de exclusión** (combinaciones clínicamente imposibles). Implementación v1
   en el panel (`odotools.jsx`, función `validarExclusion` dentro de `track`):
   - Una pieza marcada **AUSENTE** (PDA: DNE/DEX/DAO) **no admite otros tratamientos**
     en el mismo odontograma → se **bloquea** con mensaje explicativo.
   - Marcar **AUSENTE** una pieza que ya tiene registros se **permite con advertencia**
     (válido en evolución: pieza tratada y luego extraída).

## Estado de cumplimiento del sistema

| Requisito                                  | Estado                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Odontograma inicial + evolución            | ✅ (selector de tipo + contingencia INICIAL, ADR-0018)                                   |
| Registro por superficie, varios por diente | ✅ tabla `odontograma_entrada` admite N filas por diente                                 |
| Color azul/rojo (NTS-188)                  | ✅ selector de color                                                                     |
| Nomenclatura/siglas oficiales              | ⚠️ parcial (24 herramientas + catálogo 39 hallazgos; diagnóstico aún admite texto libre) |
| Trazabilidad (responsable, fecha)          | ✅ en la entrada de BD                                                                   |
| Reglas de exclusión clínica                | ⚠️ v1: solo regla de pieza AUSENTE (este ADR)                                            |

## Alternativas consideradas

- **Bloquear toda combinación** mediante una matriz completa de exclusiones:
  aplazado; alto riesgo de falsos positivos que entorpezcan el flujo clínico. Se
  prefiere empezar por la exclusión inequívoca (pieza ausente) y crecer con evidencia.
- **Hacer la validación solo como advertencia:** descartado para el caso "ausente +
  otro" porque es clínicamente imposible en un mismo odontograma; sí se usa
  advertencia para el caso reverso (válido en evolución).

## Consecuencias

- Queda explícito (para el equipo) que el diseño correcto es **multi-hallazgo por
  superficie**, no "un tratamiento por diente".
- La validación vive hoy en el cliente y se apoya en la lista de sesión
  ("Tratamientos aplicados", ADR-0017). **Trabajo futuro:** trasladar/duplicar las
  reglas a la capa de dominio del backend (`odontogramaDomain`) para que la BD sea la
  garante de integridad, y cerrar la nomenclatura a la lista oficial (eliminar texto
  libre del diagnóstico).

## Verificación

- `npx vite build` OK; `npx eslint src` → 0 errores.
- Prueba manual sugerida: marcar una pieza como AUSENTE (PDA) y luego intentar otro
  tratamiento sobre ella → debe bloquearse con el mensaje; el orden inverso advierte.
