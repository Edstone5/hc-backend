# ADR-0001: Corrección de violaciones de la capa de dominio

- **Estado:** Aceptado
- **Fecha:** 2026-05-28
- **Módulos afectados:** `hc`, `evolucion`, `diagnosticoPresuntivo`, `diagnosticoClinicas`

---

## Contexto y declaración del problema

La Arquitectura Hexagonal (Ports & Adapters, Alistair Cockburn) establece que
el **núcleo de la aplicación** (dominio + aplicación) debe ser independiente de
cualquier tecnología de infraestructura. El dominio no debe conocer la base de
datos, el framework HTTP ni ningún otro adaptador secundario.

Durante la auditoría de la Fase 1 se identificaron cuatro archivos de dominio
que violaban esta regla al importar `pool` del módulo `db/db.js` (infraestructura
de PostgreSQL):

| Archivo                                                       | Tipo de violación                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `hc/domain/hcDomain.js`                                       | Import declarativo sin uso (`import pool` presente, `pool` nunca invocado) |
| `diagnosticoClinicas/domain/diagnosticoClinicasDomain.js`     | Ídem                                                                       |
| `evolucion/domain/evolucionDomain.js`                         | Import + funciones exportadas que llamaban `pool.query()` directamente     |
| `diagnosticoPresuntivo/domain/diagnosticoPresuntivoDomain.js` | Import + funciones exportadas que llamaban `pool.query()` directamente     |

Las funciones SQL en `evolucion` y `diagnosticoPresuntivo` eran **código muerto**:
el controlador de cada módulo ya delegaba en el repositorio correspondiente
(`EvolucionRepository`, `DiagnosticoPresuntivoRepository`) y nunca invocaba las
funciones del dominio. Sin embargo, su presencia creaba un acoplamiento real
entre la capa de dominio y PostgreSQL.

---

## Factores de decisión

- La capa de dominio debe poder ser probada sin base de datos (requisito de
  testabilidad unitaria).
- Para demostrar hexagonalidad al intercambiar PostgreSQL por MySQL (ADR-0003),
  el dominio y la aplicación no pueden contener ninguna referencia a tecnologías
  de persistencia específicas.
- El código muerto aumenta la deuda técnica y confunde a futuros mantenedores.

---

## Opciones consideradas

### Opción A — Eliminar imports y funciones SQL del dominio _(elegida)_

Remover `import pool` de los cuatro archivos. Para `evolucion` y
`diagnosticoPresuntivo`, eliminar también las funciones exportadas que
contenían SQL (código muerto verificado: ningún controlador las invocaba).

**Pros:**

- Dominio limpio, sin dependencias hacia infraestructura.
- Los repositorios ya implementan la misma lógica, no se pierde funcionalidad.
- Los tests de dominio existentes no se ven afectados.

**Contras:**

- Cambio irreversible (aunque seguro dado que las funciones eran dead code).

### Opción B — Mantener las funciones y mover la lógica al repositorio

Refactorizar para que las funciones del dominio deleguen en el repositorio en
lugar de llamar directamente a `pool`. Requeriría inyección de dependencia.

**Pros:** Conserva la interfaz exportada (por si existieran consumidores externos).

**Contras:**

- Las funciones no tienen ningún consumidor conocido (código muerto confirmado).
- Introduce complejidad innecesaria.
- No soluciona el problema de acoplamiento.

---

## Resultado de la decisión

Se elige la **Opción A**.

Los cambios realizados son:

1. `hc/domain/hcDomain.js` — eliminada línea 1: `import pool from '../../db/db.js'`.
2. `diagnosticoClinicas/domain/diagnosticoClinicasDomain.js` — eliminada línea 1 ídem.
3. `evolucion/domain/evolucionDomain.js` — eliminadas línea 1 y funciones
   `consultarEvoluciones()` / `registrarEvolucion()` (líneas 110–135 originales).
4. `diagnosticoPresuntivo/domain/diagnosticoPresuntivoDomain.js` — eliminadas
   línea 1 y funciones `consultarDiagnosticoPresuntivo()` /
   `actualizarDiagnosticoPresuntivo()` (líneas 89–121 originales).
5. `diagnosticoPresuntivo/application/diagnosticoPresuntivoController.js` —
   eliminada importación muerta `consultarDiagnosticoPresuntivo as domainConsultar`.

---

## Consecuencias positivas

- Los 19 módulos de dominio son ahora libres de cualquier dependencia hacia
  `db/db.js` o cualquier otra tecnología de infraestructura.
- La prueba de hexagonalidad (ADR-0003) puede realizarse sin modificar ningún
  archivo de dominio o aplicación.
- Las suites de pruebas unitarias (Vitest) y BDD (Cucumber) continúan pasando
  sin cambios.

## Consecuencias negativas / notas

- Ninguna funcionalidad se pierde (las funciones eliminadas eran dead code).
- Si en el futuro se necesita acceso directo a la BD desde el dominio, la
  decisión correcta es implementar el patrón Port & Adapter (ver ADR-0002).
