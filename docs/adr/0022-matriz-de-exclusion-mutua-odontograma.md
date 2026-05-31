# ADR-0022 — Matriz de exclusión mutua de hallazgos del odontograma

**Fecha:** 2026-05-31
**Estado:** Aceptado
**Ramas:** `feature/odontograma-nts150` (hc-backend y hc-frontend)

---

## Contexto

El ADR-0021 trasladó al backend la regla de exclusión por **ausencia** (DNE/DEX/DAO) y
dejó como trabajo futuro **ampliar la matriz de exclusiones** (p.ej. corona total,
giroversión). Este ADR añade un conjunto pequeño y conservador de incompatibilidades
mutuas, manteniendo el criterio de evitar falsos positivos que entorpezcan el registro.

## Decisión

Se añade `GRUPOS_EXCLUSION_MUTUA` en el dominio (`odontogramaDomain.js`) y una función
`validarExclusion(codigoNuevo, codigosExistentes)` que combina la regla de ausencia
(ADR-0021) con grupos de exclusión mutua. Dentro de un grupo, **dos códigos distintos no
pueden coexistir** en la misma pieza y tipo de odontograma:

| Grupo         | Códigos              | Razón clínica                                               |
| ------------- | -------------------- | ----------------------------------------------------------- |
| `tamaño`      | MAC, MIC             | Macrodoncia y microdoncia son anomalías de tamaño opuestas. |
| `giroversión` | GV-D, GV-I           | Una pieza gira en una sola dirección.                       |
| `corona`      | Co, Cv, Cmc, Clm, Ct | Una pieza lleva a lo sumo un tipo de corona total.          |

- Se **permite** repetir el mismo código (no es contradictorio) y combinar códigos de
  **grupos distintos** (p.ej. caries `C` + corona `Co`, que aplican a niveles diferentes).
- La regla de ausencia tiene prioridad (se evalúa primero).

### Doble capa (igual que ADR-0020/0021)

- **Backend** (`odontogramaController.registrar`): usa `validarExclusion`; responde
  **409 Conflict** con el motivo. Garante de integridad.
- **Frontend** (`odotools.jsx`, `validarExclusion` + `grupoDe`): espejo por etiqueta del
  tratamiento, bloquea en el panel SVG con toast (UX inmediata).

## Alternativas consideradas

- **Incluir "corona total vs hallazgo de superficie" (C/O/R sobre pieza con corona):**
  descartado por ahora; alto riesgo de falso positivo (caries recurrente en el margen de
  una corona es clínicamente posible). Se mantiene como posible regla futura con matices.
- **Constraint de BD:** descartado por la dificultad de expresar reglas cruzadas entre
  filas de forma portable (MySQL/PostgreSQL); la validación en la capa de aplicación es
  suficiente y testeable.

## Consecuencias

- El sistema impide registrar combinaciones inequívocamente contradictorias en ambas
  superficies (panel SVG y registro estructurado), sin estorbar el multi-hallazgo
  legítimo por superficie.
- La matriz es **extensible**: agregar un grupo es añadir una entrada a
  `GRUPOS_EXCLUSION_MUTUA` (backend) y un caso en `grupoDe` (frontend).

## Verificación

- `test/odontograma.exclusion.test.js` ampliado (7 casos nuevos de matriz). Backend
  `npm test` → **1452 passing** (1445 + 7).
- Frontend `npx vite build` OK; `npx eslint src` → 0 errores.
- Prueba manual sugerida: aplicar Macrodoncia y luego Microdoncia a la misma pieza →
  bloqueo; dos coronas distintas → bloqueo; caries + corona → permitido.
