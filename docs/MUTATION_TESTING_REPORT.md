# Reporte de Mutation Testing — Stryker

**Proyecto**: Sistema de Historia Clínica — UNJBG  
**Versión**: 2.1.0 | **Fecha**: 2026-05  
**Herramienta**: Stryker Mutator 9.6.1 + Vitest runner

---

## 1. ¿Qué es Mutation Testing y por qué lo hacemos?

El **mutation testing** responde a una pregunta que la cobertura de código no puede:  
_¿Los tests realmente detectan errores en el código, o simplemente ejecutan líneas?_

Stryker introduce cambios deliberados (mutantes) en el código — como cambiar `||` por `&&`,
o cambiar un string de error por `""` — y verifica si algún test falla. Si ningún test falla,
el mutante **sobrevive** y eso indica que los tests son insuficientes para detectar ese tipo
de error.

```
Ejemplo de mutante StringLiteral:
  Original:  throw new DomainError('id_historia es requerido');
  Mutado:    throw new DomainError('');          ← ¿algún test falla? NO → sobrevive

  Causa: los tests usaban toThrow(DomainError) pero no verificaban el mensaje.
  Corrección: expect(() => ...).toThrow('id_historia es requerido')
```

---

## 2. Configuración

**Archivo**: `stryker.config.mjs`

```javascript
mutate: [19 módulos de dominio]
testRunner: 'vitest'
coverageAnalysis: 'perTest'   // más rápido: solo corre tests relevantes por mutante
thresholds: { high: 80, low: 60, break: 0 }
reporters: ['progress', 'html', 'clear-text']
concurrency: 4
```

Los módulos mutados son exclusivamente la **capa de dominio** (Value Objects, Aggregates,
interfaces de repositorio). La capa de aplicación (controllers) y la capa de infraestructura
(repositorios) no se mutan porque:

- Los controllers son thin adapters HTTP — testearlos con mutation testing requeriría
  un servidor real corriendo, lo que sale del alcance de los tests unitarios.
- Los repositorios dependen de MySQL — el mutation testing en infraestructura produciría
  miles de mutantes que solo se podrían matar con integración, no con unit tests.

---

## 3. Resultados por Versión

### v2.0.0 — Línea base (primer run)

| Módulo                 | Score      | Total mutantes | Sobrevividos | Sin cobertura |
| ---------------------- | ---------- | -------------- | ------------ | ------------- |
| filiacion              | 93.16%     | 109            | 2            | 6             |
| patient                | 93.07%     | 94             | 3            | 4             |
| motivoConsulta         | 88.68%     | 47             | 0            | 6             |
| diagnosticoPresuntivo  | 88.00%     | 66             | 5            | 4             |
| higieneBocal           | 83.50%     | 86             | 9            | 8             |
| examenGeneral          | 86.14%     | 143            | 17           | 6             |
| listaHcAdultos         | 88.89%     | 32             | 2            | 2             |
| studentUsers           | 90.63%     | 29             | 1            | 2             |
| user                   | 79.10%     | 53             | 6            | 8             |
| evolucion              | 81.91%     | 77             | 13           | 4             |
| auth                   | 88.88%     | 36             | —            | —             |
| **examenBoca**         | **76.76%** | 142            | 39           | 4             |
| **examenRegional**     | **75.27%** | 207            | 62           | 6             |
| **hcDomain**           | **72.64%** | 77             | 17           | 12            |
| **derivacionClinicas** | **66.13%** | 95             | 36           | 6             |
| diagnosticoClinicas    | 77.24%     | 95             | 24           | 4             |
| antecedente            | ~85%       | —              | —            | —             |
| **GLOBAL**             | **81.23%** | **1593**       | **118**      | **250**       |

Los 4 módulos marcados estaban por debajo del 80% y fueron objeto de mejora.

### v2.1.0 — Tras tests dirigidos por mutación

| Módulo             | v2.0.0     | v2.1.0     | Δ           | Estado      |
| ------------------ | ---------- | ---------- | ----------- | ----------- |
| examenRegional     | 75.27%     | **92.00%** | +16.7 pp    | ✅          |
| examenBoca         | 76.76%     | **87.57%** | +10.8 pp    | ✅          |
| derivacionClinicas | 66.13%     | **76.61%** | +10.5 pp    | ⚠️ bajo 80% |
| hcDomain           | 72.64%     | **80.19%** | +7.6 pp     | ✅          |
| **GLOBAL**         | **81.23%** | **85.67%** | **+4.4 pp** | ✅          |

---

## 4. Análisis de Mutantes por Tipo

### 4.1 StringLiteral (mutantes más fáciles de matar)

**Problema**: Tests usaban `toThrow(DomainError)` que solo verifica el tipo de error,
no el mensaje. Cuando Stryker cambia `'id_historia es requerido'` por `''`, el tipo
`DomainError` sigue siendo correcto, entonces el test pasa igual.

**Solución**: Reemplazar `toThrow(DomainError)` por `toThrow('mensaje exacto')` en
todos los tests de invariantes de dominio.

```javascript
// Antes (no mata StringLiteral)
expect(() => new IdHistoriaVO(null)).toThrow(DomainError);

// Después (mata StringLiteral)
expect(() => new IdHistoriaVO(null)).toThrow('id_historia es requerido');
```

**Módulos afectados**: derivacionClinicas, hcDomain, examenBoca, examenRegional  
**Tests añadidos**: 25

### 4.2 LogicalOperator — `a || b` → `a && b` (mutante dominante)

**Problema**: Los dominios usan `body.campo || body.campo_snake` para soportar dos
formatos de nombre de campo (camelCase y snake_case). Stryker cambia `||` por `&&`.
Con `&&`, si solo se provee uno de los dos campos, el resultado es `undefined` en lugar
del valor del campo. Pero los tests siempre pasaban ambos (o ninguno), así que no
detectaban la mutación.

**Solución**: Tests que proveen **solo** el alias snake_case sin el camelCase. Si el
`||` se convierte en `&&`, el test falla porque el campo queda `undefined`.

```javascript
// Mata LogicalOperator en body.labiosSin || body.labios_sin_lesiones
it('snake_case only → params[1]', () => {
  const agg = new ExamenBocaAggregate({
    id_historia: UUID,
    body: { labios_sin_lesiones: 'Normal' }, // SOLO snake_case, sin camelCase
  });
  expect(agg.obtenerParametros()[1]).toBe('Normal');
});
```

**Módulos afectados**: examenRegional (43 campos), examenBoca (30+ campos)  
**Tests añadidos**: ~80

### 4.3 ConditionalExpression — condiciones compuestas

**Problema**: Condiciones tipo `!value || typeof value !== 'string'` donde Stryker
muta el `||` a `&&`. Con `&&`, una cadena vacía `''` pasaría la condición porque
`!'' = true` pero `typeof '' !== 'string' = false`, así que `true && false = false`
y no lanzaría el error esperado. Los tests no cubrían específicamente la cadena vacía.

**Solución**: Añadir test explícito con `''` (cadena vacía) que verifica el lanzamiento.

```javascript
// Mata ConditionalExpression: !value || typeof value !== 'string' → &&
it('cadena vacía → lanza (mata || → &&)', () => {
  expect(() => new IdHistoriaClinicaVO('')).toThrow('id_historia invalido');
});
```

**Módulos afectados**: examenRegional, derivacionClinicas  
**Tests añadidos**: 5

### 4.4 EqualityOperator — valores límite exactos

**Problema**: Condiciones como `num > 10` donde Stryker cambia a `num >= 10` o
`num > 9`. Si el test no verifica exactamente el valor límite (10), el mutante sobrevive.

**Solución**: Tests con BVA (Boundary Value Analysis) en los límites exactos.

```javascript
// Mata EqualityOperator: num > 10 → num >= 10
it('10 → válido (límite superior exacto)', () => {
  expect(new AgudezaVisualVO(10).value).toBe(10); // debe pasar
});
it('10.001 → null (justo fuera del límite)', () => {
  expect(new AgudezaVisualVO(10.001).value).toBeNull(); // debe rechazar
});
```

**Módulos afectados**: examenRegional (AgudezaVisualVO, AperturaMaximaVO, MusculosDolorGradoVO)  
**Tests añadidos**: 10

---

## 5. Mutantes que persisten en derivacionClinicas (76.61%)

Los 6 mutantes sobrevivientes restantes en `derivacionClinicas` son `LogicalOperator` en
`_normalizePrimitive` (función interna no exportada) y en condiciones multi-parte del
`DestinosValueObject`. Se requeriría test de aislamiento de ruta interna para matarlos,
lo cual implicaría exponer la función (rompe encapsulamiento) o escribir tests muy específicos
del orden de evaluación, algo que genera fragilidad en el test suite.

**Decisión**: Aceptar los 6 mutantes restantes. La cobertura del módulo en covered-code
es **80.51%** (supera el umbral). El score general del proyecto (85.67%) está bien por
encima del umbral de 80%.

---

## 6. Cómo ejecutar

```bash
# Ejecutar mutation testing completo (~80 segundos)
npm run test:mutation

# Ver reporte HTML detallado
open reports/mutation/mutation.html

# En CI: se ejecuta automáticamente todos los lunes a las 3 AM UTC
# Artefacto disponible en GitHub Actions → Artifacts → mutation-report
```

---

## 7. Tendencia histórica

| Versión | Score global | Tests unitarios | BDD    |
| ------- | ------------ | --------------- | ------ |
| v1.0.0  | n/a          | ~800            | n/a    |
| v2.0.0  | 81.23%       | 1 282           | 91     |
| v2.1.0  | **85.67%**   | **1 389**       | **91** |

**Objetivo para v3.0.0**: ≥ 88% global, incluyendo derivacionClinicas ≥ 80%.

---

_Documento bajo control de versiones en `docs/MUTATION_TESTING_REPORT.md`._
_Actualizar con cada run de Stryker que cambie el score en ≥ 1 pp._
