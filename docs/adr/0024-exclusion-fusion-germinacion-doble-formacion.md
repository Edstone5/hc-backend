# ADR-0024 — Exclusión mutua "doble formación" (Fusión vs Germinación)

- **Estado:** Aceptado
- **Fecha:** 2026-05-31
- **Ramas:** `feature/odontograma-nts150` (hc-backend y hc-frontend)
- **Relacionado:** ADR-0020 (modelo clínico multi-hallazgo), ADR-0021 (exclusión por ausencia en dominio), ADR-0022 (matriz de exclusión mutua)

## Contexto

El ADR-0022 introdujo `GRUPOS_EXCLUSION_MUTUA` con tres grupos (tamaño, giroversión,
corona) y dejó como trabajo futuro **ampliar la matriz con reglas con matices**,
manteniendo el criterio conservador de evitar falsos positivos (la matriz opera por
**pieza + tipo de odontograma**, no por superficie, así que combinaciones legítimas
como caries + obturación, o amalgama + resina en caras distintas, NO deben bloquearse).

Se evaluaron varias reglas candidatas (carilla vs corona, pulpotomía vs endodoncia,
macrodoncia vs clavija). Se decidió incorporar **solo** la de mayor confianza clínica y
riesgo de falso positivo prácticamente nulo.

## Decisión

Se añade un cuarto grupo a `GRUPOS_EXCLUSION_MUTUA`:

| Grupo             | Códigos | Razón clínica                                                                                                                                          |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `doble formación` | F, G    | Fusión y germinación son diagnósticos diferenciales de la misma anomalía de doble formación (gemación): una pieza es una u otra, nunca ambas a la vez. |

No se incorporaron las otras candidatas:

- **Carilla (Cf) vs corona total:** descartada por ahora; clínicamente defendible pero
  con más matices (una carilla y una corona aplican a coberturas distintas).
- **Pulpotomía (PP) vs endodoncia (Endo):** descartada; en un odontograma evolutivo
  podría documentarse la progresión de un tratamiento a otro.
- **Macrodoncia (MAC) vs pieza en clavija (PC):** descartada; aunque MAC y PC son
  opuestos, una clavija ES microdóntica (MIC + PC sí son compatibles), lo que obligaría
  a un grupo asimétrico solo MAC↔PC — mayor riesgo de confusión que beneficio.

### Doble capa (igual que ADR-0020/0021/0022)

- **Backend** (`odontograma/domain/odontogramaDomain.js`): nueva entrada en
  `GRUPOS_EXCLUSION_MUTUA`; `validarExclusion` ya recorre los grupos genéricamente, no
  requirió más cambios. El controlador responde **409 Conflict** con el motivo
  (`...grupo: doble formación...`).
- **Frontend** (`odotools.jsx`, `grupoDe`): espejo por etiqueta del tratamiento; "Fusión"
  → `{ g: 'doble formación', v: 'F' }` y "Germinación" → `{ ..., v: 'G' }`. Bloquea en
  el panel SVG con toast (UX inmediata) antes de dibujar.

## Consecuencias

- El sistema impide marcar Fusión y Germinación en la misma pieza y tipo, en ambas vías
  (panel SVG y registro estructurado), sin afectar el multi-hallazgo legítimo.
- La matriz sigue siendo **extensible**: agregar un grupo es una entrada en
  `GRUPOS_EXCLUSION_MUTUA` (backend) + un caso en `grupoDe` (frontend).

## Verificación (Norma de Oro)

- `test/odontograma.exclusion.test.js` ampliado (3 casos nuevos: bloqueo F+G, F+otro
  grupo permitido, y los 4 nombres de grupo). Backend `npm test` → **1454 passing**
  (1452 + 2 nuevos casos efectivos; el archivo de exclusión pasa de 17 a 19 tests).
- Frontend `npx eslint src` → 0 errores; `npx vite build` OK.
- Prueba manual sugerida: aplicar Fusión y luego Germinación a la misma pieza → bloqueo
  con toast; en "Registro de intervenciones", registrar F y luego G en el mismo diente y
  tipo → toast con el 409 del backend.
