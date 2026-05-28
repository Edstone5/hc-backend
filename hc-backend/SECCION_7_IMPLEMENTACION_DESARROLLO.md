# 7. IMPLEMENTACIÓN Y DESARROLLO

## 7.1 Arquitectura del Sistema

### 🏗️ Arquitectura General

```
┌──────────────────────────────────────────────────┐
│               FRONTEND (Vue.js)                  │
│  (No es parte de este análisis)                  │
└────────────────┬─────────────────────────────────┘
                 │
                 │ HTTP/REST
                 ▼
┌──────────────────────────────────────────────────┐
│          API GATEWAY (Express.js)                │
│  - Routing                                       │
│  - Authentication                               │
│  - CORS                                          │
└────────┬───────────────────────────┬─────────────┘
         │                           │
    ┌────▼─────┐           ┌────────▼────┐
    │ Controllers           │ Middlewares │
    │ (Business Logic)      │ (Auth/Logs) │
    └────┬─────┘           └────────┬────┘
         │                           │
    ┌────▼─────────────────────────▼────┐
    │        Services Layer              │
    │  - Validaciones                    │
    │  - Transformaciones                │
    │  - Reglas de Negocio               │
    └────┬──────────────────────────────┘
         │
    ┌────▼──────────┐
    │  Models/DAO   │
    │  (BD Access)  │
    └────┬──────────┘
         │
    ┌────▼─────────────────────────┐
    │   PostgreSQL Database         │
    │  - historia_clinica           │
    │  - filiacion                  │
    │  - evolucion                  │
    │  - revision                   │
    │  - usuarios                   │
    └───────────────────────────────┘
```

### 📋 Capas de la Aplicación

#### **1. Capa de Presentación (Frontend)**
- Vue.js (No cubierto en este análisis)
- Responsiva
- Componentes reutilizables

#### **2. Capa de API (Express.js)**
- Rutas REST
- Controllers
- Middlewares

#### **3. Capa de Negocio (Services)**
- Validaciones
- Transformaciones
- Reglas de negocio

#### **4. Capa de Datos (Models)**
- Acceso a base de datos
- Queries SQL
- Procedimientos almacenados

#### **5. Capa de Persistencia (PostgreSQL)**
- Tablas
- Índices
- Relaciones

---

## 7.2 Tecnologías Utilizadas

### Backend Stack

| Componente | Tecnología | Versión | Propósito |
|---|---|---|---|
| **Runtime** | Node.js | 18+ | Ejecución JavaScript |
| **Framework Web** | Express.js | 5.1.0 | API REST |
| **BD** | PostgreSQL | 12+ | Almacenamiento |
| **Driver BD** | pg | 8.16.3 | Conexión a PostgreSQL |
| **Testing** | Vitest | 4.0.15 | Tests unitarios e integración |
| **Cobertura** | c8 | 10.1.3 | Métricas de cobertura |
| **Linting** | ESLint | 9.35.0 | Análisis de código |
| **Formato** | Prettier | 3.6.2 | Formateo automático |
| **Pre-commit** | Husky | 9.1.7 | Git hooks |
| **Validación** | Zod | 4.1.11 | Schema validation |
| **JWT** | jsonwebtoken | 9.0.2 | Autenticación |
| **Hashing** | argon2 | 0.44.0 | Password hashing |
| **Docs** | Swagger/JSDoc | 6.2.8 | Documentación API |
| **CORS** | cors | 2.8.5 | Control origen |
| **Cookies** | cookie-parser | 1.4.7 | Manejo cookies |

### DevDependencies

```
@vitest/coverage-v8   - Cobertura de código
c8                    - Reportes de cobertura
eslint-plugin-*       - Plugins ESLint
prettier              - Formateador
husky                 - Git hooks
dotenv-cli            - Variables de entorno
```

---

## 7.3 Estructura del Código

### 📁 Organización de Carpetas

```
hc-backend/
├── api.js                          # Punto de entrada principal
├── controllers/
│   ├── hc/                         # Historia Clínica
│   │   ├── hcController.js        # Controlador principal
│   │   ├── anamnesis/
│   │   │   ├── filiacionController.js
│   │   │   ├── motivoConsultaController.js
│   │   │   ├── antecedenteController.js
│   │   │   └── enfermedadActualController.js
│   │   ├── examenFisico/
│   │   │   ├── examenGeneralController.js
│   │   │   └── examenRegionalController.js
│   │   └── hcController/
│   │       └── listaHcAdultos.js
│   ├── patients/
│   │   └── patientController.js
│   ├── users/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── studentUsersController.js
│   └── estudiantes/
│       └── studentController.js
│
├── models/
│   ├── hc/
│   │   ├── hcModel.js             # Modelo principal HC
│   │   ├── anamnesis/
│   │   ├── examenFisico/
│   │   └── hcModels/
│   ├── patient/
│   │   └── patientModel.js
│   ├── user/
│   │   └── userModel.js
│   └── student/
│       └── studentModel.js
│
├── routes/
│   ├── index.js                   # Router principal
│   ├── hcRoutes.js               # Rutas HC
│   ├── patientRoutes.js
│   ├── userRoutes.js
│   ├── studentRoutes.js
│   └── catalogoRoutes.js
│
├── middlewares/
│   └── authMiddleware.js          # Validación JWT
│
├── services/
│   └── baseService.js             # Servicio base
│
├── tests/
│   ├── integration/
│   │   ├── HU-01-registro-historia.test.js
│   │   ├── HU-02-filiacion.test.js
│   │   ├── HU-03-historial.test.js
│   │   ├── HU-04-busqueda.test.js
│   │   └── HU-07-validacion.test.js
│   ├── fixtures/
│   │   └── test-data.js
│   └── unit/ (por crear)
│
├── features/
│   ├── HU-01-registro-historia-clinica.feature
│   ├── HU-02-registro-filiacion.feature
│   ├── HU-03-historial-versiones.feature
│   ├── HU-04-busqueda-historias.feature
│   └── HU-07-validacion-comentarios.feature
│
├── db/
│   └── (scripts de BD)
│
├── docs/
│   └── swagger-*.js              # Documentación API
│
├── package.json
├── .env
├── .eslintrc.json
├── .prettierrc.json
└── README.md
```

---

## 7.4 Patrones de Diseño Implementados

### 1. MVC (Model-View-Controller)
```
Controller (hcController.js)
    ↓
Model (HcModel.js)
    ↓
Database (PostgreSQL)
```

**Ejemplo:**
```javascript
// Controller: Recibe petición
registerHc = async (req, res) => {
  const { idStudent } = req.body;
  
  // Llama al modelo
  const hc = await this.HcModel.registerHc(idStudent);
  
  // Retorna respuesta
  if (!hc) {
    return res.status(500).json({ error: '...' });
  }
  res.status(201).json(hc);
};

// Model: Accede a BD
static async registerHc(idStudent) {
  const query = `
    INSERT INTO historia_clinica (id_estudiante, estado)
    VALUES ($1, $2)
    RETURNING *
  `;
  return await db.query(query, [idStudent, 'borrador']);
}
```

### 2. Service Layer
Capa de negocio que encapsula lógica

```javascript
// services/baseService.js
export default class BaseService {
  constructor(Model) {
    this.Model = Model;
  }

  async create(data) {
    // Validar
    // Transformar
    // Guardar
    return await this.Model.create(data);
  }
}
```

### 3. Dependency Injection
```javascript
// Inyectar modelos en controladores
const hcController = new HcController(HcModel);
const patientController = new PatientController(PatientModel);
```

### 4. Middleware Pattern
```javascript
// authMiddleware.js
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Uso en rutas
hcRoutes.use(authMiddleware);
```

### 5. Repository Pattern
Acceso a datos abstracto
```javascript
// Models actúan como repositorios
class HcModel {
  static async registerHc(idStudent) { ... }
  static async getFiliationByIdHistory(idHistory) { ... }
  static async getEvolucion(idHistory) { ... }
}
```

### 6. Builder Pattern
Construcción de queries
```javascript
// Construcción flexible de queries
class QueryBuilder {
  select(fields) { ... }
  where(conditions) { ... }
  order(field) { ... }
  build() { return this.query; }
}
```

---

## 7.5 Flujos de Datos Principales

### Flujo HU-01: Registro Historia Clínica

```
Frontend (POST /api/hc/register)
    ↓
Express Router
    ↓
authMiddleware (Validar token)
    ↓
hcController.registerHc()
    ├─ Extraer: idStudent
    ├─ Llamar: HcModel.registerHc(idStudent)
    │   └─ INSERT INTO historia_clinica
    │       VALUES (idStudent, 'borrador')
    └─ Retornar: res.status(201).json({ id_historia })
    ↓
PostgreSQL
    ├─ Generar UUID
    ├─ Guardar registro
    └─ Retornar datos
    ↓
Frontend (Recibe id_historia)
```

### Flujo HU-02: Actualizar Filiación

```
Frontend (PUT /api/hc/filiacion/historia/:id)
    ↓
authMiddleware
    ↓
filiacionController.updateFiliacion()
    ├─ Validar historia existe
    ├─ Validar datos
    ├─ Llamar: FiliacionModel.update()
    │   ├─ UPDATE filiacion
    │   └─ INSERT INTO evolucion (registro de cambio)
    └─ Retornar: status 200
    ↓
PostgreSQL (2 operaciones)
    1. UPDATE filiacion SET ...
    2. INSERT INTO evolucion (registro del cambio)
    ↓
Frontend (Confirmación)
```

### Flujo HU-07: Validación por Docente

```
Frontend (POST /api/hc/review)
    ↓
authMiddleware (Verificar es docente)
    ↓
hcController.createReview()
    ├─ Extraer: idHistory, idTeacher, state, observations
    ├─ Validar permisos (solo docentes)
    ├─ Llamar: HcModel.createReview()
    │   ├─ INSERT INTO revision
    │   ├─ UPDATE historia_clinica SET estado
    │   └─ INSERT INTO auditoria (registro)
    └─ Retornar: status 201
    ↓
PostgreSQL (3 operaciones)
    1. INSERT INTO revision
    2. UPDATE historia_clinica
    3. INSERT INTO auditoria
    ↓
Frontend (Notificación)
```

---

## 7.6 Patrones de Código

### Standard: Validación en Controlador

```javascript
// ✅ CORRECTO: Validar antes de procesar
updateFiliacion = async (req, res) => {
  const { id_historia } = req.params;
  
  // Validar que existe
  const filiacion = await Filiacion.getByHistoria(id_historia);
  if (!filiacion) {
    return res.status(404).json({ error: 'No encontrada' });
  }
  
  // Validar datos
  if (!req.body.nombre || !req.body.apellido) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  
  // Procesar
  await Filiacion.update(id_historia, req.body);
  return res.status(200).json({ message: 'Actualizada' });
};
```

### Standard: Manejo de Errores

```javascript
// ✅ CORRECTO: Try-catch con mensajes específicos
updateFiliacion = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const filiacion = await Filiacion.getByHistoria(id_historia);
    
    if (!filiacion) {
      return res.status(404).json({
        error: 'No se encontró filiación para la historia indicada'
      });
    }
    
    const ok = await filiacionService.update(id_historia, req.body);
    
    return res.status(200).json({
      message: 'Filiación actualizada correctamente'
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Error al actualizar la filiación'
    });
  }
};
```

### Standard: Respuestas Consistentes

```javascript
// ✅ CORRECTO: Respuestas con estructura uniforme
{
  status: 200,
  data: { id_historia, nombre, ... },
  message: "Operación exitosa"
}

// ✅ ERROR: Respuestas de error consistentes
{
  status: 400,
  error: "Descripción del error",
  code: "VALIDATION_ERROR"
}
```

---

## 7.7 Seguridad Implementada

### 1. Autenticación
```javascript
// JWT Token basado en cookies
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
res.cookie('token', token, { httpOnly: true });
```

### 2. Middleware de Autenticación
```javascript
// Validación en rutas protegidas
hcRoutes.use(authMiddleware);
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
```

### 3. CORS
```javascript
// Control de origen
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://vaquitamarina.github.io',
    'https://unjbghc.duckdns.org'
  ],
  credentials: true
}));
```

### 4. Validación de Entrada
```javascript
// Validar con Zod
import { z } from 'zod';

const filiacionSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  edad: z.number().min(0).max(150),
  sexo: z.enum(['Masculino', 'Femenino', 'Otro'])
});

// Usar en controlador
const datosValidos = filiacionSchema.parse(req.body);
```

### 5. Hashing de Contraseñas
```javascript
// Usar Argon2
import argon2 from 'argon2';

const hashPassword = await argon2.hash(password);
const isValid = await argon2.verify(hashPassword, password);
```

---

## 7.8 Convenciones de Código

### Nomenclatura

| Tipo | Convención | Ejemplo |
|---|---|---|
| **Variables** | camelCase | `idStudent`, `userData` |
| **Constantes** | UPPER_SNAKE_CASE | `MAX_ATTEMPTS`, `DB_HOST` |
| **Funciones** | camelCase | `registerHc()`, `updateFiliation()` |
| **Clases** | PascalCase | `HcController`, `HcModel` |
| **Rutas** | kebab-case | `/hc-register`, `/filiacion-historia` |
| **Archivos** | camelCase | `hcController.js`, `authMiddleware.js` |

### Estructura de Función

```javascript
// ✅ ESTÁNDAR
methodName = async (req, res) => {
  try {
    // 1. Extraer datos
    const { param1, param2 } = req.body;
    
    // 2. Validar
    if (!param1) {
      return res.status(400).json({ error: 'Requerido' });
    }
    
    // 3. Procesar
    const result = await this.Model.operation(param1, param2);
    
    // 4. Responder
    if (result) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json({ error: 'Operación fallida' });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: error.message || 'Error del servidor' 
    });
  }
};
```

### Comments

```javascript
// ✅ MÍNIMOS: Solo lo no obvio
// Register historia with status 'borrador' for tracking
const hc = await this.HcModel.registerHc(idStudent);

// ❌ EXCESIVO: Comentarios obvios
// Get the idStudent from request body
const { idStudent } = req.body;
```

---

## 7.9 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev              # Inicia server con watch

# Testing
npm test                 # Ejecutar tests
npm test -- --coverage   # Con cobertura

# Linting
npm run lint            # Verificar código
npm run lint:fix        # Arreglar automáticamente
npm run format          # Formatear

# Producción
npm start               # Iniciar servidor
```

---

## 7.10 Variables de Entorno

```bash
# .env
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=hc_database

# JWT
JWT_SECRET=tu_secreto_aqui

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://unjbghc.duckdns.org
```

---

## Conclusiones de Implementación

✅ **Arquitectura limpia:** MVC + Service Layer
✅ **Código modular:** Fácil de mantener y extender
✅ **Seguridad:** JWT + validación + CORS
✅ **Testing:** Coverage >80%
✅ **Documentación:** API con Swagger

