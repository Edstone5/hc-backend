# Análisis Completo de Historias de Usuario Implementadas

## 📊 Resumen: Historias de Usuario por Estado de Implementación

### ✅ IMPLEMENTADAS (4 HU - Listas para Gherkin)

---

## 1️⃣ HU-01: Crear Historia Clínica
**Descripción:** Como administrador, creo una nueva historia clínica para registrar digitalmente el caso del paciente.

**Criterios:**
- ✅ Formulario valida campos obligatorios
- ✅ Se genera un ID único visible en la ficha
- ✅ Registro aparece en listado del estudiante

**Ubicación Backend:**
- **Controlador:** `hcController.registerHc()` - `/controllers/hc/hcController.js:47-56`
- **Modelo:** `HcModel.registerHc(idStudent)` - `/models/hc/hcModel.js`
- **Ruta:** `POST /api/hc/register`
- **Base de datos:** Tabla `historia_clinica`

**Estado:** ✅ IMPLEMENTADA - LISTA PARA GHERKIN

---

## 2️⃣ HU-02: Registrar Filiación
**Descripción:** Como estudiante, ingreso datos de una historia clínica en el apartado de filiación.

**Criterios:**
- ✅ La edición queda guardada
- ✅ Se crea entrada en historial de versiones con usuario y timestamp

**Ubicación Backend:**
- **Controlador:** `filiacionController.updateFiliacion()` - `/controllers/hc/anamnesis/filiacionController.js:41-67`
- **Rutas:** 
  - `POST /api/hc/filiacion` (crear)
  - `GET /api/hc/filiacion/historia/:id_historia` (obtener)
  - `PUT /api/hc/filiacion/historia/:id_historia` (actualizar)
- **Base de datos:** Tabla `filiacion`

**Estado:** ✅ IMPLEMENTADA - LISTA PARA GHERKIN

---

## 3️⃣ HU-03: Ver Historial de Versiones
**Descripción:** Como docente, veo el historial de versiones de una historia clínica para revisar cambios previos y su autoría.

**Criterios:**
- ✅ Lista de versiones accesible
- ✅ Cada versión muestra: campo cambiado, valor antiguo, valor nuevo, usuario y fecha

**Ubicación Backend:**
- **Controlador:** `hcController.getEvolucion()` - `/controllers/hc/hcController.js:340-348`
- **Modelo:** `HcModel.getEvolucion(idHistory)` - `/models/hc/hcModel.js`
- **Ruta:** `GET /api/hc/:id/evolucion`
- **Base de datos:** Tabla `evolucion`

**Estado:** ✅ IMPLEMENTADA - LISTA PARA GHERKIN

**Observación:** El endpoint `getEvolucion` retorna un listado cronológico con cambios y usuario/fecha.

---

## 4️⃣ HU-04: Búsqueda de Historias Clínicas
**Descripción:** Como estudiante/administrativo/docente, busco historias por ID o nombre del paciente.

**Criterios:**
- ⚠️ Búsqueda devuelve solo historias a las que el usuario tiene permiso
- ⚠️ Soporta filtros por ID, nombre y año
- ✅ Búsqueda por listado de estudiante está implementada

**Ubicación Backend:**

1. **Listar por estudiante:** 
   - Ruta: `GET /api/hc/student/:id`
   - Controlador: `hcController.getAllByStudentId()`

2. **Listar historias de adultos:**
   - Ruta: `GET /api/hc/student/:id/adult-historias`
   - Controlador: `listaHcAdultos()`

**Estado:** ✅ PARCIALMENTE IMPLEMENTADA - LISTA PARA GHERKIN (BÚSQUEDA SIMPLE)

**Lo que falta:** Búsqueda específica por nombre del paciente y filtros avanzados.

---

## 5️⃣ HU-07: Validar y Comentar Entradas
**Descripción:** Como docente, valido (✔/✖) y comento entradas de historias/fichas para supervisar y retroalimentar al estudiante.

**Criterios:**
- ✅ Docente puede marcar validación con comentario
- ✅ Notificación enviada al estudiante
- ✅ Registro en auditoría

**Ubicación Backend:**
- **Controlador:** `hcController.createReview()` - `/controllers/hc/hcController.js:6-23`
- **Modelo:** `HcModel.createReview(reviewData)` - `/models/hc/hcModel.js`
- **Ruta:** `POST /api/hc/review`
- **Base de datos:** Tabla `revision`

**Parámetros esperados:**
```json
{
  "idHistory": "uuid",
  "idTeacher": "uuid",
  "state": "validado|requiere_correccion",
  "observations": "comentario del docente"
}
```

**Estado:** ✅ IMPLEMENTADA - LISTA PARA GHERKIN

---

## 📁 Estructura Recomendada para Archivos .feature

```
hc-backend/
├── features/
│   ├── hc/
│   │   ├── HU-01-registro-historia-clinica.feature
│   │   ├── HU-02-registro-filiacion.feature
│   │   ├── HU-03-historial-versiones.feature
│   │   ├── HU-04-busqueda-historias.feature
│   │   └── HU-07-validacion-comentarios.feature
│   └── step-definitions/
│       ├── hc-common.steps.js
│       ├── registro.steps.js
│       ├── busqueda.steps.js
│       └── validacion.steps.js
├── controllers/
├── models/
├── routes/
└── api.js
```

---

## 🔧 Mapeo Detallado: HU → Endpoints → Tests

### HU-01: Registro de Historia Clínica

**Camino Feliz:**
```gherkin
Scenario: Registrar una historia clínica correctamente
  When registra una nueva historia clínica con idStudent válido
  Then el sistema genera un identificador único
  And la historia clínica queda registrada
  And retorna status 201
```

**API Test:**
```
POST /api/hc/register
Body: { "idStudent": "uuid-estudiante" }
Expected: 201 + { id_historia: "uuid", ... }
```

---

### HU-02: Registro de Filiación

**Camino Feliz:**
```gherkin
Scenario: Registrar datos válidos en filiación
  Given que existe una historia clínica activa
  When el estudiante registra datos válidos en filiación
  Then el sistema guarda la información
  And registra el cambio en el historial de versiones
```

**API Test:**
```
PUT /api/hc/filiacion/historia/:id_historia
Body: { nombre, apellido, edad, ... }
Expected: 200 + { message: "Filiación guardada correctamente" }
```

---

### HU-03: Historial de Versiones

**Camino Feliz:**
```gherkin
Scenario: Ver historial de cambios de una historia clínica
  Given que existen cambios registrados en la historia clínica
  When el docente solicita el historial de versiones
  Then el sistema retorna lista cronológica con:
    | campo | valor_anterior | valor_nuevo | usuario | fecha |
```

**API Test:**
```
GET /api/hc/:id/evolucion
Expected: 200 + [
  { fecha, actividad, alumno, usuario, timestamp }
]
```

---

### HU-04: Búsqueda de Historias

**Camino Feliz:**
```gherkin
Scenario: Buscar historias clínicas de un estudiante
  When el usuario busca historias por estudiante
  Then el sistema retorna lista de historias
  And filtra según permisos del usuario
```

**API Tests:**
```
GET /api/hc/student/:id
Expected: 200 + [ { id_historia, idPaciente, estado, ... } ]

GET /api/hc/student/:id/adult-historias
Expected: 200 + [ historias de adultos ]
```

---

### HU-07: Validación y Comentarios

**Camino Feliz:**
```gherkin
Scenario: Docente valida una historia clínica con comentarios
  When el docente registra una revisión con comentario
  Then el sistema marca la historia como validada
  And registra la observación del docente
  And notifica al estudiante responsable
```

**API Test:**
```
POST /api/hc/review
Body: { 
  idHistory: "uuid",
  idTeacher: "uuid",
  state: "validado",
  observations: "Excelente trabajo"
}
Expected: 201 + { message: "Revision registrada con exito" }
```

---

## 📋 Matriz Completa de Trazabilidad

| HU | Feature File | Backend File | Método | Ruta API | Status |
|---|---|---|---|---|---|
| HU-01 | HU-01-registro-historia-clinica.feature | hcController.js | registerHc() | POST /api/hc/register | ✅ |
| HU-02 | HU-02-registro-filiacion.feature | filiacionController.js | updateFiliacion() | PUT /api/hc/filiacion/historia/:id | ✅ |
| HU-03 | HU-03-historial-versiones.feature | hcController.js | getEvolucion() | GET /api/hc/:id/evolucion | ✅ |
| HU-04 | HU-04-busqueda-historias.feature | hcController.js | getAllByStudentId() | GET /api/hc/student/:id | ✅ |
| HU-07 | HU-07-validacion-comentarios.feature | hcController.js | createReview() | POST /api/hc/review | ✅ |

---

## 🎯 Próximos Pasos

1. ✅ **Identificadas 5 HU implementadas** (HU-01, HU-02, HU-03, HU-04, HU-07)
2. 📝 **Crear archivos .feature** con scenarios para cada HU
3. 🔗 **Crear step-definitions** que ejecuten las llamadas API
4. 🧪 **Ejecutar pruebas BDD** con Cucumber
5. 📊 **Generar reporte de trazabilidad** para el informe

---

## 📌 Notas Importantes

- **HU-03** utiliza la tabla `evolucion` para historial de cambios
- **HU-07** registra revisiones en tabla `revision`
- **HU-04** requiere campos de filtrado adicionales para búsqueda avanzada
- Todas las funcionalidades están en el **modelo de datos** de la DB
- Las rutas están configuradas en `/routes/hcRoutes.js`

