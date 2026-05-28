# 📋 MATRIZ DE TRAZABILIDAD - User Story, Gherkin, Pruebas de Integración

## Descripción

Esta matriz relaciona cada Historia de Usuario (HU) con:
1. **Archivo Gherkin (.feature)** - Especificación de comportamiento BDD
2. **Prueba de Integración** - Test automático del backend
3. **Endpoints API** - Servicios REST implementados
4. **Controlador** - Lógica de negocio

---

## 📊 Matriz Completa

| HU | User Story | Archivo Gherkin | Prueba de Integración | Endpoint API | Controlador | Estado |
|---|---|---|---|---|---|---|
| **HU-01** | Registro de Historia Clínica | `HU-01-registro-historia-clinica.feature` | `tests/integration/HU-01-registro-historia.test.js` | `POST /api/hc/register` | `hcController.registerHc()` | ✅ |
| **HU-02** | Registro de Filiación | `HU-02-registro-filiacion.feature` | `tests/integration/HU-02-filiacion.test.js` | `PUT /api/hc/filiacion/historia/:id` | `filiacionController.updateFiliacion()` | ✅ |
| **HU-03** | Historial de Versiones | `HU-03-historial-versiones.feature` | `tests/integration/HU-03-historial.test.js` | `GET /api/hc/:id/evolucion` | `hcController.getEvolucion()` | ✅ |
| **HU-04** | Búsqueda de Historias | `HU-04-busqueda-historias.feature` | `tests/integration/HU-04-busqueda.test.js` | `GET /api/hc/student/:id` | `hcController.getAllByStudentId()` | ✅ |
| **HU-07** | Validación y Comentarios | `HU-07-validacion-comentarios.feature` | `tests/integration/HU-07-validacion.test.js` | `POST /api/hc/review` | `hcController.createReview()` | ✅ |

---

## 📁 Estructura de Archivos

```
hc-backend/
├── features/
│   ├── HU-01-registro-historia-clinica.feature
│   ├── HU-02-registro-filiacion.feature
│   ├── HU-03-historial-versiones.feature
│   ├── HU-04-busqueda-historias.feature
│   └── HU-07-validacion-comentarios.feature
│
├── tests/
│   ├── integration/
│   │   ├── HU-01-registro-historia.test.js
│   │   ├── HU-02-filiacion.test.js
│   │   ├── HU-03-historial.test.js
│   │   ├── HU-04-busqueda.test.js
│   │   └── HU-07-validacion.test.js
│   │
│   └── fixtures/
│       └── test-data.js
│
├── controllers/
│   └── hc/hcController.js
│
└── routes/
    └── hcRoutes.js
```

---

## 🔍 Detalle de Trazabilidad por HU

### HU-01: Registro de Historia Clínica

**Especificación Gherkin:**
- Archivo: `features/HU-01-registro-historia-clinica.feature`
- Escenarios: 4
  - ✅ Registrar correctamente con datos válidos
  - ✅ Rechazar sin datos obligatorios
  - ✅ Verificar ID único
  - ✅ Validar en listado

**Prueba de Integración:**
- Archivo: `tests/integration/HU-01-registro-historia.test.js`
- Tests:
  - ✅ Crear historia clínica (POST)
  - ✅ Generar UUID único
  - ✅ Aparecer en listado (GET)
  - ✅ Rechazar sin idStudent

**Backend:**
- Controlador: `hcController.registerHc()`
- Ruta: `POST /api/hc/register`
- Modelo: `HcModel.registerHc(idStudent)`
- BD: Tabla `historia_clinica`

**Criterios de Aceptación:**
- ✅ ID único generado (UUID)
- ✅ Status 201 en éxito
- ✅ Status 500 en error
- ✅ Registro en BD verificable

---

### HU-02: Registro de Filiación

**Especificación Gherkin:**
- Archivo: `features/HU-02-registro-filiacion.feature`
- Escenarios: 5
  - ✅ Registrar datos válidos
  - ✅ Actualizar existentes
  - ✅ Rechazar inválidos
  - ✅ Error historia inexistente
  - ✅ Historial de versiones

**Prueba de Integración:**
- Archivo: `tests/integration/HU-02-filiacion.test.js`
- Tests:
  - ✅ Crear filiación (POST)
  - ✅ Actualizar filiación (PUT)
  - ✅ Guardar información
  - ✅ Rechazar datos inválidos
  - ✅ Registrar cambios en historial

**Backend:**
- Controlador: `filiacionController.updateFiliacion()`
- Rutas:
  - `POST /api/hc/filiacion`
  - `PUT /api/hc/filiacion/historia/:id`
  - `GET /api/hc/filiacion/historia/:id`
- Modelo: `FiliacionModel.update()`
- BD: Tabla `filiacion`

**Criterios de Aceptación:**
- ✅ Campos requeridos validados
- ✅ Status 201/200 en éxito
- ✅ Historial actualizado con usuario/timestamp
- ✅ Datos inválidos rechazados

---

### HU-03: Historial de Versiones

**Especificación Gherkin:**
- Archivo: `features/HU-03-historial-versiones.feature`
- Escenarios: 7
  - ✅ Historial accesible
  - ✅ Información completa de cambios
  - ✅ Orden cronológico
  - ✅ Identificación de responsable
  - ✅ Historial vacío
  - ✅ Control de acceso
  - ✅ Auditoría registrada

**Prueba de Integración:**
- Archivo: `tests/integration/HU-03-historial.test.js`
- Tests:
  - ✅ Obtener historial (GET)
  - ✅ Verificar estructura de cambios
  - ✅ Validar timestamps
  - ✅ Comprobar ordenamiento
  - ✅ Verificar información completa

**Backend:**
- Controlador: `hcController.getEvolucion()`
- Ruta: `GET /api/hc/:id/evolucion`
- Modelo: `HcModel.getEvolucion(idHistory)`
- BD: Tabla `evolucion`

**Criterios de Aceptación:**
- ✅ Lista de versiones accesible
- ✅ Campo, valores anterior/nuevo, usuario, fecha
- ✅ Orden cronológico
- ✅ Status 200 en éxito

---

### HU-04: Búsqueda de Historias

**Especificación Gherkin:**
- Archivo: `features/HU-04-busqueda-historias.feature`
- Escenarios: 7
  - ✅ Búsqueda por estudiante
  - ✅ Sin resultados
  - ✅ Respeto de permisos
  - ✅ Filtro por tipo
  - ✅ Múltiples resultados
  - ✅ Búsqueda por nombre (futuro)
  - ✅ Ordenamiento

**Prueba de Integración:**
- Archivo: `tests/integration/HU-04-busqueda.test.js`
- Tests:
  - ✅ Listar por estudiante (GET)
  - ✅ Listar adultos (GET)
  - ✅ Verificar permisos
  - ✅ Manejo lista vacía
  - ✅ Estructura de datos

**Backend:**
- Controlador: `hcController.getAllByStudentId()`
- Rutas:
  - `GET /api/hc/student/:id`
  - `GET /api/hc/student/:id/adult-historias`
- Modelo: `HcModel.getAllByStudentId()`
- BD: Tabla `historia_clinica`

**Criterios de Aceptación:**
- ✅ Búsqueda devuelve historias permitidas
- ✅ Soporta filtros
- ✅ Status 200 en éxito
- ✅ Array vacío sin resultados

---

### HU-07: Validación y Comentarios

**Especificación Gherkin:**
- Archivo: `features/HU-07-validacion-comentarios.feature`
- Escenarios: 8
  - ✅ Validación con comentario
  - ✅ Rechazo con observaciones
  - ✅ Notificación al estudiante
  - ✅ Registro en auditoría
  - ✅ Control de permisos
  - ✅ Múltiples validaciones
  - ✅ Observaciones opcionales
  - ✅ Historial de validaciones

**Prueba de Integración:**
- Archivo: `tests/integration/HU-07-validacion.test.js`
- Tests:
  - ✅ Crear revisión validada (POST)
  - ✅ Crear revisión rechazada (POST)
  - ✅ Verificar auditoría
  - ✅ Control de permisos
  - ✅ Múltiples revisiones
  - ✅ Observaciones opcionales

**Backend:**
- Controlador: `hcController.createReview()`
- Ruta: `POST /api/hc/review`
- Modelo: `HcModel.createReview()`
- BD: Tabla `revision`

**Criterios de Aceptación:**
- ✅ Validación registrada
- ✅ Comentarios guardados
- ✅ Notificación al estudiante
- ✅ Auditoría completa
- ✅ Status 201 en éxito
- ✅ Solo docentes pueden validar

---

## 🧪 Cómo Ejecutar las Pruebas

### Instalación de Dependencias (si no está hecho)
```bash
npm install
```

### Ejecutar todas las pruebas de integración
```bash
npm test -- tests/integration/
```

### Ejecutar test específico
```bash
npm test -- tests/integration/HU-01-registro-historia.test.js
```

### Ejecutar con cobertura
```bash
npm test -- --coverage tests/integration/
```

---

## 📊 Resumen de Cobertura

| Métrica | Valor |
|---|---|
| **User Stories Especificadas** | 5 HU |
| **Archivos Gherkin** | 5 .feature |
| **Escenarios Gherkin** | 31 escenarios |
| **Pruebas de Integración** | 5 archivos .test.js |
| **Test Cases Totales** | 35+ assertions |
| **Endpoints Cubiertos** | 7 endpoints |
| **Controladores** | 4 métodos |
| **Cobertura de Caminos** | Happy Path + Error Path |

---

## ✅ Validaciones Implementadas

### Camino Feliz (Happy Path)
- ✅ Operaciones exitosas con datos válidos
- ✅ Retorno de códigos HTTP correctos (201, 200)
- ✅ Datos almacenados correctamente
- ✅ Respuestas con estructura esperada

### Camino de Error (Error Path)
- ✅ Validación de datos inválidos
- ✅ Manejo de recursos no encontrados (404)
- ✅ Validación de permisos (401, 403)
- ✅ Errores del servidor (500)

---

## 🔗 Referencias Cruzadas

### De HU a Gherkin
```
HU-01 → HU-01-registro-historia-clinica.feature
       → Escenario: "Registrar una historia clínica correctamente"
       → Criterios de aceptación validados
```

### De Gherkin a Test
```
HU-01-registro-historia-clinica.feature
       → HU-01-registro-historia.test.js
       → Método: "Debe crear una historia clínica con idStudent válido"
       → POST /api/hc/register
```

### De Test a Backend
```
HU-01-registro-historia.test.js
       → hcController.registerHc()
       → HcModel.registerHc(idStudent)
       → Tabla: historia_clinica
```

---

## 📝 Notas para Documentación

1. **Trazabilidad Bidireccional:** Cada HU puede rastrearse hasta su test y viceversa
2. **Automatización:** Todos los tests pueden ejecutarse automáticamente
3. **CI/CD Integration:** Los tests pueden integrarse en pipeline de CI/CD
4. **Mantenibilidad:** Cambios en especificación se reflejan en tests
5. **Auditoría:** Matriz proporciona evidencia de cobertura

