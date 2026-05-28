# 📌 Proyecto Backend – Sistema de Gestión de Historias Clínicas

Este repositorio contiene el **backend** del sistema de gestión de historias clínicas.  
Está construido con **Node.js + Express** bajo una arquitectura organizada en capas.

## 🚀 Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js versión 22.19.0 o superior
- npm versión 9 o superior (incluido con Node.js)
- Git

---

# 📌 Convención de Respuestas API (GET & POST)

## 🔹 GET (obtener datos)

| Escenario                       | Código HTTP     | Respuesta JSON                                 |
| ------------------------------- | --------------- | ---------------------------------------------- |
| ✅ Con resultados (lista)       | `200 OK`        | `[ { "id": 1, "nombre": "Paciente Adulto" } ]` |
| ✅ Con resultado (recurso)      | `200 OK`        | `{ "id": 1, "nombre": "Paciente Adulto" }`     |
| ✅ Sin resultados (lista vacía) | `200 OK`        | `[]`                                           |
| ❌ Recurso no encontrado        | `404 Not Found` | `{ "error": "Recurso no encontrado" }`         |

---

## 🔹 POST (crear recurso o acción, ej: registro/login)

| Escenario                         | Código HTTP                 | Respuesta JSON                               |
| --------------------------------- | --------------------------- | -------------------------------------------- |
| ✅ Creación exitosa               | `201 Created`               | `{ "id": 101, "nombre": "Juan Pérez" }`      |
| ✅ Acción exitosa (ej: login)     | `200 OK`                    | `{"id": 101, "nombre": "Juan Pérez" }`       |
| ❌ Datos inválidos / conflicto    | `400 Bad Request`           | `{ "error": "El email ya está registrado" }` |
| ❌ Usuario no encontrado (login)  | `404 Not Found`             | `{ "error": "Usuario no encontrado" }`       |
| ❌ Credenciales inválidas (login) | `401 Unauthorized`          | `{ "error": "Credenciales inválidas" }`      |
| ❌ Error interno                  | `500 Internal Server Error` | `{ "error": "Ocurrió un error inesperado" }` |

## 📂 Estructura del proyecto

### 📁 Descripción de carpetas y archivos

- **data/**  
  Mockups o datos temporales para pruebas.  
  Ejemplo: `users.json`.

- **controllers/**  
  Contienen la lógica de negocio para cada recurso de la API.  
  Ejemplo: `userController.js`.

- **middlewares/**  
  Funciones intermedias para validación, manejo de errores, autenticación, etc.  
  Ejemplo: `errorHandler.js`, `authMiddleware.js`.

- **models/**  
  Definen la estructura de los datos (más adelante conectados a una base de datos).  
  Ejemplo: `userModel.js`.

- **routes/**  
  Definen las rutas y endpoints de la API, vinculando con los controladores.  
  Ejemplo: `userRoutes.js`.

- **utils/**  
  Funciones auxiliares reutilizables.  
  Ejemplo: `logger.js`, `readJSON.js`.

- **api.js**  
  Punto de entrada de la aplicación Express. Configura middlewares globales, rutas y levanta el servidor en el puerto **3000**.

- **.gitignore**  
  Archivos y carpetas ignorados en el repositorio (`node_modules`, `.env`).

- **package.json**  
  Define dependencias, scripts y configuración básica del proyecto.

- **package-lock.json**  
  Guarda las versiones exactas de las dependencias instaladas.

---

## ⚡ Instalación y uso

1. **Clonar el repositorio**  
   `git clone <url-del-repo>`
   `cd hc-backend`

2. **Instalar dependencias**
   `npm install`

3. **Levantar el servidor en desarrollo**
   `npm run dev`
   El backend quedara disponible en localhost:3000/api, por ahora funciona el localhost:3000/api/users

---

## 🏗️ Flujo de Trabajo con Git

El flujo de trabajo del proyecto se basa en el uso de ramas para cada nueva tarea, ya sea una funcionalidad, un componente o un arreglo. Esto nos permite trabajar de forma paralela sin interferir en el trabajo de los demás.

**Pasos:**

1.  **Crear una nueva rama**: Antes de empezar a trabajar en una tarea, crea una rama específica desde la rama principal (`main` o `develop`).

    ```bash
    git checkout -b nombre-de-la-rama
    ```

2.  **Realizar commits**: A medida que trabajas, haz `commits` en esta nueva rama para guardar tus cambios. Utiliza mensajes de `commit` descriptivos.

    ```bash
    git commit -m "add new user"
    ```

3.  **Subir la rama**: Una vez que hayas terminado la tarea, sube tu rama al repositorio remoto para que otros la puedan ver y revisar.
    ```bash
    git push origin nombre-de-la-rama
    ```

---

## 🏷️ Convención de Nombres para Ramas

Para mantener la coherencia y la claridad, usaremos una convención de nombres para las ramas. El formato es `<tipo>/<descripcion-de-la-tarea>`.

**Tipos de ramas comunes:**

- `feat`: Para una **nueva funcionalidad** o característica.
  - **Ejemplo:** `feat/add-contact-form`
- `fix`: Para una **corrección de errores** (bug fix).
  - **Ejemplo:** `fix/correct-email-validation`
- `docs`: Para cambios en la **documentación**.
  - **Ejemplo:** `docs/update-readme`
- `refactor`: Para **refactorización** de código que no cambia la funcionalidad.
  - **Ejemplo:** `refactor/improve-button-structure`
- `chore`: Para tareas de **mantenimiento** o configuración del proyecto.
  - **Ejemplo:** `chore/update-dependencies`
- `test`: Para añadir o modificar **pruebas**.
  - **Ejemplo:** `test/add-login-unit-tests`

**Consideraciones adicionales:**

- **Minúsculas**: Usa solo letras minúsculas.
- **Guiones**: Separa las palabras con guiones (`-`).
- **Sé descriptivo**: La descripción debe ser lo suficientemente clara para que, con solo leer el nombre de la rama, se entienda de qué trata la tarea.

---

## 📖 Convenciones

### **📋 Convenciones de Nomenclatura para Front-end**

Para mantener un código limpio y consistente, seguiremos las siguientes convenciones de nomenclatura para el desarrollo del front-end.

#### **1. Nomenclatura en JavaScript**

- **Variables**: Las variables se declararán utilizando **camelCase**.
  - **Ejemplo**: `vaquitaMarina`
- **Clases**: Los nombres de las clases se escribirán en **PascalCase**.
  - **Ejemplo**: `UserModel`

---

#### **4. Convención de Idioma**

- Todos los nombres de variables y clases se escribirán en **inglés** para mantener una convención global y evitar ambigüedades.
  - **Ejemplo**: Usa `userModel` en lugar de `modeloDeUsuario`.

---

## Notas

- El repo tiene autoformteo y linteo ya configurado, se activa al momento de

---

## 🧪 Suite de Pruebas

El proyecto cuenta con **tres capas de pruebas** que trabajan de forma complementaria para garantizar la calidad del dominio de negocio.

```
┌─────────────────────────────────────────────────────┐
│  CAPA 3 — Pruebas de Mutantes (Stryker)             │
│  "¿Mis pruebas detectan errores reales?"            │
│  Score global: 93.78% — 498 mutantes analizados     │
├─────────────────────────────────────────────────────┤
│  CAPA 2 — Pruebas Unitarias (Vitest)                │
│  "¿Cada pieza del dominio funciona correctamente?"  │
│  666 tests en 45 archivos — todos PASS              │
├─────────────────────────────────────────────────────┤
│  CAPA 1 — Pruebas BDD (Cucumber)                    │
│  "¿El sistema se comporta como el usuario espera?"  │
│  41 escenarios, 160 pasos — todos PASS              │
└─────────────────────────────────────────────────────┘
```

### Comandos de prueba

```bash
# Pruebas unitarias (una sola ejecución)
npx vitest run

# Pruebas unitarias (modo watch — se re-ejecutan al guardar)
npm test

# Pruebas BDD / Gherkin
npx cucumber-js

# Pruebas de mutantes (genera reporte HTML)
npm run test:mutation
```

---

### Capa 1 — BDD con Cucumber (Gherkin en español)

Archivos en `features/` escritos en **Gherkin en español** (`# language: es`), siguiendo el patrón **TestingAPI de Alistair Cockburn**: cada módulo tiene un adaptador sustituto que instancia los agregados de dominio directamente, sin pasar por Express ni base de datos real.

#### Escenarios cubiertos

| Feature                    | Escenarios | Módulo de dominio                                              |
| -------------------------- | ---------- | -------------------------------------------------------------- |
| `filiacion.feature`        | 5          | Datos del paciente, edad, sexo, fechas                         |
| `enfermedadActual.feature` | 6          | Síntoma principal obligatorio, campos opcionales               |
| `motivoConsulta.feature`   | 5          | Motivo de consulta con doble invariante                        |
| `antecedente.feature`      | 7          | 4 tipos de antecedentes + seguimiento                          |
| `examenGeneral.feature`    | 5          | Temperatura, peso, presión arterial (normalización silenciosa) |
| `examenBoca.feature`       | 4          | Examen bucal (solo upsert, sin create)                         |
| `higieneBocal.feature`     | 5          | Higiene bucal + normalización prefijo `HC-`                    |
| `examenRegional.feature`   | 4          | Examen regional por secciones                                  |
| **Total**                  | **41**     | **160 pasos**                                                  |

#### Estructura por módulo BDD

```
features/
├── <modulo>.feature                       # Escenarios en Gherkin español
├── support/<Modulo>TestingAPI.js          # Adaptador primario sustituto
└── step_definitions/<modulo>Steps.js      # Steps + InMemoryRepository (Map)
```

**Convenciones aplicadas:**

- Cada módulo usa su propio prefijo en el paso de error para evitar conflictos:  
  `'se debe lanzar un error de <modulo> con el mensaje {string}'`
- Los repositorios in-memory replican exactamente la interfaz del repositorio real
- Módulos sin `create` (`examenBoca`, `higieneBocal`) usan semántica **upsert** en el stub
- Hook `Before` por escenario garantiza aislamiento total de estado

---

### Capa 2 — Pruebas Unitarias de Dominio (Vitest)

Archivos en `test/*.domain.test.js` que prueban directamente las clases de dominio (Value Objects y Aggregates) sin ninguna dependencia externa.

#### Archivos de pruebas de dominio

| Archivo                                | Tests | Qué cubre                                                                         |
| -------------------------------------- | ----- | --------------------------------------------------------------------------------- |
| `test/filiacion.domain.test.js`        | 45    | `EdadClinicaVO` [0–130], `FechaClinicaVO`, `#normalizeSexo`, `FiliacionAggregate` |
| `test/enfermedadActual.domain.test.js` | 39    | `IdHistoriaClinicaVO`, `TextoClinicoObligatorioVO`, `EnfermedadActualAggregate`   |
| `test/motivoConsulta.domain.test.js`   | 44    | `MotivoConsultaVO` (invariante tipo + vacío), `MotivoConsultaAggregate`           |
| `test/antecedente.domain.test.js`      | 86    | `EnteroNoNegativoVO`, `FechaClinicaVO`, 4 aggregates                              |
| `test/examenGeneral.domain.test.js`    | 92    | `TemperaturaVO`, `PesoVO`, `PresionArterialVO`, aliases camelCase/snake_case      |

**Técnicas aplicadas:**

- **BVA (Boundary Value Analysis):** se prueba el valor en el límite, justo debajo y justo encima
- **Mensajes de error exactos:** `toThrow('El sintoma principal es obligatorio')` sin aproximaciones
- **`obtenerParametros()` con índices posicionales:** verifica el orden correcto del array SQL
- **`Object.freeze`:** se intenta mutar propiedades para confirmar inmutabilidad
- **Normalización silenciosa:** `TemperaturaVO(100)` → `null` sin lanzar excepción

---

### Capa 3 — Pruebas de Mutantes (Stryker 9.6.1)

Stryker introduce pequeños errores sintácticos en el código fuente (mutantes) y verifica que las pruebas unitarias los detecten. Si una prueba pasa con el código roto → el mutante **sobrevive** (problema). Si la prueba falla → el mutante es **eliminado** (correcto).

#### Resultados por módulo

| Módulo                      | Score       | Muertos       | Sobrevividos |
| --------------------------- | ----------- | ------------- | ------------ |
| `motivoConsultaDomain.js`   | **100%** 🎯 | 47 / 47       | 0            |
| `filiacionDomain.js`        | **98.2%**   | 109 / 111     | 2            |
| `antecedenteDomain.js`      | **94.5%**   | 103 / 109     | 6            |
| `enfermedadActualDomain.js` | **93.0%**   | 66 / 71       | 5            |
| `examenGeneralDomain.js`    | **88.75%**  | 142 / 160     | 18           |
| **TOTAL**                   | **93.78%**  | **467 / 498** | **31**       |

> Los 31 mutantes que sobreviven son en su mayoría **mutantes equivalentes** — versiones del código que producen exactamente el mismo comportamiento observable para todas las entradas posibles. No se pueden eliminar sin crear falsos positivos.

#### Tipos de mutaciones analizadas

| Tipo                    | Ejemplo de mutación                        |
| ----------------------- | ------------------------------------------ |
| `ConditionalExpression` | `parsedValue < 0` → `parsedValue <= 0`     |
| `LogicalOperator`       | `body.campo \|\| body.campo_snake` → `&&`  |
| `StringLiteral`         | `'DomainError'` → `""`                     |
| `Regex`                 | `/^UUID$/` → `/UUID$/` (elimina ancla `^`) |
| `MethodExpression`      | `String(value).trim()` → `String(value)`   |
| `BlockStatement`        | Elimina todo el bloque `if { ... }`        |

#### Reporte HTML interactivo

```bash
npm run test:mutation
# → abre: reports/mutation/mutation.html
```

El reporte muestra cada mutante, qué prueba lo eliminó y cuáles sobrevivieron con su explicación.

#### Configuración (stryker.config.mjs)

```js
export default {
  testRunner: 'vitest',
  mutate: [
    'filiacion/domain/filiacionDomain.js',
    'enfermedadActual/domain/enfermedadActualDomain.js',
    'motivoConsulta/domain/motivoConsultaDomain.js',
    'antecedente/domain/antecedenteDomain.js',
    'examenGeneral/domain/examenGeneralDomain.js',
  ],
  thresholds: { high: 80, low: 60, break: 0 },
  reporters: ['progress', 'html', 'clear-text'],
};
```

---

### Dependencias de prueba instaladas

| Paquete                          | Versión | Propósito                      |
| -------------------------------- | ------- | ------------------------------ |
| `vitest`                         | ^4.0.15 | Framework de pruebas unitarias |
| `@vitest/coverage-v8`            | ^4.0.15 | Cobertura de código            |
| `@cucumber/cucumber`             | ^12.9.0 | Framework BDD / Gherkin        |
| `@stryker-mutator/core`          | ^9.6.1  | Motor de pruebas de mutantes   |
| `@stryker-mutator/vitest-runner` | ^9.6.1  | Integración Stryker + Vitest   |
| `supertest`                      | ^7.2.2  | Pruebas de endpoints HTTP      |
