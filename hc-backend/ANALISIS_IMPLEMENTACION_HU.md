# Análisis de Implementación - Historias de Usuario (BDD)

## 📋 Resumen Ejecutivo

Se ha identificado que las tres historias de usuario (HU-01, HU-02, HU-04) **ESTÁN PARCIALMENTE IMPLEMENTADAS** en el backend. La mayoría de la lógica existe, pero requiere ser mapeada con archivos `.feature` de Gherkin.

---

## 🎯 HU-01: Registro de Historia Clínica

### ✅ Estado: IMPLEMENTADO

**Ubicación en Backend:**
- **Controlador**: `hcController.registerHc()` 
  - Archivo: `/controllers/hc/hcController.js` (líneas 47-56)
- **Modelo**: `HcModel.registerHc(idStudent)`
- **Ruta API**: `POST /api/hc/register`

**Código Relevante:**
```javascript
registerHc = async (req, res) => {
  const { idStudent } = req.body;
  const hc = await this.HcModel.registerHc(idStudent);
  if (!hc) {
    return res.status(500).json({
      error: 'Error al registrar la historia clinica',
    });
  }
  res.status(201).json(hc);
};
```

**Flujo de Negocio Implementado:**
- ✅ Recibe ID del estudiante
- ✅ Genera identificador único (UUID en base de datos)
- ✅ Retorna error si faltan datos
- ✅ Retorna la historia clínica creada

---

## 🎯 HU-02: Registro de Filiación

### ✅ Estado: IMPLEMENTADO

**Ubicaciones en Backend:**

1. **Controlador Principal** - `filiacionController.js`
   - Archivo: `/controllers/hc/anamnesis/filiacionController.js`
   - Funciones:
     - `createFiliacion()` (líneas 6-21) - POST
     - `updateFiliacion()` (líneas 41-67) - PUT
     - `getFiliacion()` (líneas 23-39) - GET

2. **Controlador Alternativo** - `hcController.js`
   - `updateFiliation()` (líneas 116-133)

**Rutas API:**
- `POST /api/hc/filiacion` - Crear filiación
- `GET /api/hc/filiacion/historia/:id_historia` - Obtener filiación
- `PUT /api/hc/filiacion/historia/:id_historia` - Actualizar filiación

**Flujo de Negocio Implementado:**
- ✅ Validación de historia clínica activa
- ✅ Guardado de datos válidos
- ✅ Validación de campos requeridos
- ✅ Registra cambios en historial

---

## 🎯 HU-04: Búsqueda de Historias Clínicas

### ⚠️ Estado: PARCIALMENTE IMPLEMENTADO

**Lo que SÍ está implementado:**

1. **Listar todas las historias de un estudiante**
   - Controlador: `hcController.getAllByStudentId()` (líneas 25-34)
   - Ruta: `GET /api/hc/student/:id`

2. **Listar historias de adultos**
   - Controlador: `listaHcAdultos()` 
   - Archivo: `/controllers/hc/hcController/listaHcAdultos.js`
   - Ruta: `GET /api/hc/student/:id/adult-historias`

**Lo que FALTA implementar:**
- ❌ Búsqueda por **nombre del paciente**
- ❌ Búsqueda general (búsqueda de historias inexistentes debe retornar "no existen resultados")

**Recomendación:** Crear endpoint adicional:
```javascript
// GET /api/hc/search?pacienteName=nombre
// Buscar historia clínica por nombre del paciente
```

---

## 📁 Estructura Recomendada para Archivos .feature

```
hc-backend/
├── features/
│   ├── hc/
│   │   ├── registro-historia-clinica.feature      (HU-01)
│   │   ├── registro-filiacion.feature              (HU-02)
│   │   └── busqueda-historias-clinicas.feature     (HU-04)
│   └── step-definitions/
│       ├── hc.steps.js
│       └── search.steps.js
├── controllers/
├── models/
├── routes/
└── api.js
```

---

## 🔧 Mapeo: Archivos .feature → Código Backend

### HU-01: Registro de Historia Clínica

**Camino Feliz** ✅
```
Feature: Registro de Historia Clínica
  Scenario: Registrar una historia clínica correctamente
    When registra una nueva historia clínica
    Then el sistema genera un identificador único
    
→ Mapea a: POST /api/hc/register
  Controlador: hcController.registerHc()
  Validación: Debe retornar status 201 + UUID generado
```

**Camino de Error** ✅
```
Scenario: Registrar historia clínica sin idStudent
    When intenta registrar sin datos
    Then el sistema rechaza el registro
    
→ Mapea a: POST /api/hc/register (sin body)
  Validación: Debe retornar status 500
```

---

### HU-02: Registro de Filiación

**Camino Feliz** ✅
```
Feature: Gestión de Filiación
  Scenario: Registrar datos válidos en filiación
    Given que existe una historia clínica activa
    When el estudiante registra datos válidos
    Then el sistema guarda la información
    
→ Mapea a: PUT /api/hc/filiacion/historia/:id_historia
  Controlador: filiacionController.updateFiliacion()
  Validación: Debe retornar status 200 + mensaje de éxito
```

**Camino de Error** ✅
```
Scenario: Registrar datos inválidos
    When el estudiante ingresa datos inválidos
    Then el sistema rechaza la operación
    
→ Mapea a: PUT /api/hc/filiacion/historia/:id_historia (datos inválidos)
  Validación: Debe retornar status 400 o 500 + error
```

---

### HU-04: Búsqueda de Historias Clínicas

**Camino Feliz** ⚠️ REQUIERE IMPLEMENTACIÓN
```
Feature: Búsqueda de Historias Clínicas
  Scenario: Buscar historia clínica existente
    Given que existe una historia clínica registrada
    When el usuario busca por nombre del paciente
    Then el sistema retorna la historia clínica
    
→ REQUIERE: Nuevo endpoint GET /api/hc/search?pacienteName=:name
  Controlador: patientController.searchByName() [A CREAR]
  Validación: Debe retornar status 200 + historia encontrada
```

**Camino de Error** ⚠️ REQUIERE IMPLEMENTACIÓN
```
Scenario: Buscar historia inexistente
    When el usuario realiza la búsqueda
    Then el sistema informa que no existen resultados
    
→ Mapea a: GET /api/hc/search?pacienteName=:name (no existe)
  Validación: Debe retornar status 200 + array vacío []
```

---

## 📋 Matriz de Trazabilidad (Required for Report)

| User Story | Feature File | Archivo Backend | Método | Ruta API | Estado |
|---|---|---|---|---|---|
| HU-01 | registro-historia-clinica.feature | hcController.js | registerHc() | POST /api/hc/register | ✅ |
| HU-02 | registro-filiacion.feature | filiacionController.js | updateFiliacion() | PUT /api/hc/filiacion/historia/:id | ✅ |
| HU-04 | busqueda-historias-clinicas.feature | patientController.js | searchByName() | GET /api/hc/search | ❌ |

---

## 🚀 Próximos Pasos

1. **Crear carpeta `/features` en la raíz** del proyecto
2. **Escribir los 3 archivos .feature** con los scenarios
3. **Instalar Cucumber/Gherkin** en el proyecto
4. **Crear step-definitions** que llamen a los controladores
5. **Completar HU-04**: Implementar búsqueda por nombre de paciente
6. **Integrar las pruebas** con Vitest existente

---

## 📝 Archivos Clave del Proyecto

```
hc-backend/
├── controllers/
│   └── hc/
│       ├── hcController.js                 ← HU-01, HU-02
│       ├── anamnesis/
│       │   └── filiacionController.js      ← HU-02
│       └── hcController/
│           └── listaHcAdultos.js           ← HU-04 (parcial)
├── models/
│   └── hc/
│       └── hcModel.js                      ← Lógica de BD
├── routes/
│   └── hcRoutes.js                         ← Rutas API
└── api.js                                  ← Punto de entrada
```

