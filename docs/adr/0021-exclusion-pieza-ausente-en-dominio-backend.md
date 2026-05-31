# ADR-0021 — Regla de exclusión "pieza ausente" en la capa de dominio/backend

**Fecha:** 2026-05-31
**Estado:** Aceptado
**Rama:** `feature/odontograma-nts150` (hc-backend)

---

## Contexto

El ADR-0020 introdujo la primera regla de exclusión clínica (pieza ausente no admite
otros hallazgos) **solo en el cliente** (`odotools.jsx`). El propio ADR-0020 dejó como
trabajo futuro **trasladar la validación al backend** para que la base de datos sea la
garante de integridad y no dependa del navegador.

Pre-requisito ya cumplido: las entradas del odontograma (`odontograma_entrada`) ya
guardan `codigo_hallazgo` validado contra el catálogo oficial (`HallazgoVO` +
`hallazgosCatalogo.js`), y el formulario de intervenciones envía ese código mediante un
selector estructurado. Por tanto la nomenclatura ya está cerrada y el backend puede
clasificar los hallazgos por código.

## Decisión

Implementar la exclusión en el **dominio + capa de aplicación** del módulo odontograma:

1. **Dominio (`odontograma/domain/odontogramaDomain.js`):**
   - `CODIGOS_AUSENCIA = new Set(['DNE', 'DEX', 'DAO'])` — códigos que marcan la pieza
     como no presente (no erupcionado / extraído / ausente otra causa).
   - `validarExclusionAusencia(codigoNuevo, codigosExistentes)` — **función pura**:
     bloquea si la pieza ya tiene un código de ausencia y el nuevo hallazgo NO es de
     ausencia. Permite registrar una ausencia adicional sobre una pieza ya ausente.
   - Getters públicos en `OdontogramaEntradaAggregate`: `numeroDiente`, `tipo`,
     `codigoHallazgo` (para que la capa de aplicación valide sin tocar props privadas).

2. **Aplicación (`odontograma/application/odontogramaController.js`):** en `registrar`,
   antes de insertar, se listan las entradas de la historia, se filtran por **misma
   pieza y mismo tipo** (INICIAL/EVOLUCION), se reúnen sus `codigo_hallazgo` y se evalúa
   `validarExclusionAusencia`. Si falla, responde **409 Conflict** con el motivo; el
   cliente lo muestra como toast de error (sin cambios en el frontend).

### Alcance de la regla (deliberadamente conservador)

- **Bloquea:** registrar cualquier hallazgo (incluido texto libre sin código) sobre una
  pieza ya marcada como ausente en el mismo tipo de odontograma.
- **No bloquea:** marcar una pieza como ausente aunque ya tenga hallazgos (acto de
  extracción válido); ni aplica entre tipos distintos (un DEX en EVOLUCION no bloquea un
  hallazgo en INICIAL). Se prefiere empezar por el caso inequívoco y crecer con evidencia.

## Alternativas consideradas

- **Constraint de BD (CHECK/trigger):** descartado por ahora; la lógica "ausente bloquea
  otros" es cruzada entre filas y difícil de expresar portablemente entre MySQL y
  PostgreSQL. La validación en la capa de aplicación es suficiente y testeable.
- **Matriz completa de exclusiones:** aplazado (mismo criterio que ADR-0020).

## Consecuencias

- La integridad de la regla ya no depende del cliente: cualquier consumidor del endpoint
  `POST /:id/odontograma` queda sujeto a la validación.
- Doble defensa: el cliente (UX inmediata, ADR-0020) + el backend (garantía, este ADR).
- **Trabajo futuro:** ampliar el conjunto de exclusiones (p.ej. corona total vs hallazgo
  de superficie) y evaluar un constraint de BD cuando el conjunto de reglas se estabilice.

## Verificación

- Nuevo `test/odontograma.exclusion.test.js` (10 casos: función pura, getters y ruta 409
  del controlador con repositorio mockeado).
- `npm test` → **1445 passing** (1435 previos + 10).
