# ADR-0002: Introducción de interfaces de puerto en la capa de dominio

- **Estado:** Aceptado
- **Fecha:** 2026-05-28
- **Módulos afectados:** todos los 19 módulos del sistema

---

## Contexto y declaración del problema

En la Arquitectura Hexagonal, el dominio define **puertos** (interfaces/contratos)
y la infraestructura provee **adaptadores** (implementaciones). Antes de esta
decisión, los repositorios existían como clases concretas independientes sin
ningún contrato formal que los ligara al dominio.

Esto generaba dos problemas:

1. **Ausencia de contrato explícito:** no existía ninguna especificación de qué
   métodos debe ofrecer un repositorio para cada módulo. Cualquier desarrollador
   podía crear un repositorio con métodos arbitrarios y el sistema funcionaría
   sólo por convención.

2. **Dirección de dependencia ambigua:** sin una interfaz en el dominio, la
   relación infraestructura → dominio no estaba formalizada. El repositorio
   "conocía" al dominio sólo porque importaba sus agregados; el dominio no
   declaraba nada sobre el repositorio.

---

## Factores de decisión

- JavaScript no tiene interfaces nativas, pero el patrón puede implementarse con
  **clases abstractas** (métodos que lanzan `Error('No implementado')`).
- La interfaz debe vivir en la capa de dominio (no en infraestructura) para que
  la dependencia vaya en la dirección correcta: infraestructura → dominio.
- Los repositorios en memoria usados en tests BDD no necesitan extender la
  interfaz (duck typing de JavaScript es suficiente para los tests).
- El cambio debe ser no disruptivo: los tests existentes deben seguir pasando.

---

## Opciones consideradas

### Opción A — Clases abstractas en cada archivo de dominio _(elegida)_

Añadir al final de cada `*Domain.js` una clase `I[Módulo]Repository` con los
métodos que el repositorio concreto debe implementar. Cada método lanza
`Error('[Interfaz].[método]() no implementado')` si no es sobreescrito.

Los repositorios concretos extienden `I[Módulo]Repository`:

```js
// infrastructure/filiacionRepository.js
import { IFiliacionRepository } from '../domain/filiacionDomain.js';

export class FiliacionRepository extends IFiliacionRepository {
  async create(agregado) {
    /* implementación real */
  }
  // ...
}
```

**Pros:**

- Contrato explícito y autogenerado como documentación.
- Dirección de dependencia correcta: infraestructura importa del dominio.
- Sin librerías adicionales.
- Compatible con Vitest y Stryker sin configuración extra.

**Contras:**

- No es una interfaz "real" (no impide instanciar la clase abstracta directamente).
- Requiere disciplina: cada nuevo método del repositorio debe añadirse también
  a la interfaz.

### Opción B — TypeScript interfaces

Convertir el proyecto a TypeScript y usar `interface IFiliacionRepository`.

**Pros:** Verificación en tiempo de compilación.

**Contras:**

- Migración a TypeScript está fuera del alcance del MVP.
- Requiere configuración adicional (tsconfig, ts-node, etc.).
- Cambio disruptivo que invalidaría la suite de pruebas actual.

### Opción C — No agregar contratos (mantener el estado actual)

**Pros:** Sin cambios.

**Contras:** No demuestra el patrón Port & Adapter al docente. La Arquitectura
Hexagonal queda incompleta.

---

## Resultado de la decisión

Se elige la **Opción A**.

Para cada uno de los 19 módulos se añade:

1. Una clase `I[Módulo]Repository` al final del archivo `*Domain.js` del módulo,
   exportada como named export.
2. El repositorio concreto en `*/infrastructure/*Repository.js` extiende la
   interfaz e importa del dominio.

La convención de nombre del puerto es `I` + nombre del módulo en PascalCase +
`Repository`. Ejemplos: `IFiliacionRepository`, `IHcRepository`, `IAuthRepository`.

---

## Consecuencias positivas

- El contrato entre dominio e infraestructura es **explícito y legible**.
- La dirección de dependencia correcta queda codificada en el `import`:
  `infrastructure/*.js` importa de `domain/*.js`, nunca al revés.
- El intercambio de base de datos (ADR-0003) puede realizarse creando una
  nueva clase que extienda la misma interfaz, sin tocar el dominio.
- Facilita el onboarding: cualquier desarrollador que implemente un nuevo
  repositorio sabe exactamente qué métodos debe proveer.

## Consecuencias negativas / notas

- Los repositorios en memoria de los tests BDD (`InMemoryXxxRepository`) **no**
  extienden la interfaz (son clases locales en los step definitions). Esto es
  intencional: en JavaScript el duck typing es suficiente para las pruebas y
  forzar la herencia añadiría acoplamiento innecesario a los tests.
- Si se añade un nuevo método a un repositorio concreto, debe registrarse también
  en la interfaz del dominio para mantener el contrato actualizado.
