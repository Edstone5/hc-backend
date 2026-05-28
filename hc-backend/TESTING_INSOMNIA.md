# 🧪 Guía de Testing para Insomnia

## Sistema de Historias Clínicas - Backend API

**Fecha:** 25 de octubre de 2025  
**Base URL:** `http://localhost:3000/api`

---

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Usuarios - Authentication](#usuarios-authentication)
3. [Usuarios - Management](#usuarios-management)
4. [Estudiantes](#estudiantes)
5. [Historias Clínicas](#historias-clínicas)
6. [Notas Importantes](#notas-importantes)

---

## 🔧 Configuración Inicial

### Variables de Entorno en Insomnia

Crea un entorno con las siguientes variables:

```json
{
  "base_url": "http://localhost:3000/api",
  "access_token": "",
  "user_id": "",
  "student_id": ""
}
```

---

## 👤 Usuarios - Authentication

### 1. Registrar Usuario (POST)

**Endpoint:** `{{base_url}}/users/register`

**Body (JSON):**

```json
{
  "userCode": "2025-999999",
  "firstName": "Test",
  "lastName": "Usuario",
  "dni": "99999999",
  "email": "test@unjbg.edu.pe",
  "role": "estudiante",
  "password": "TestPassword123!"
}
```

**Respuesta Esperada:**

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente"
}
```

---

### 2. Login (POST)

**Endpoint:** `{{base_url}}/users/login`

**Usuarios de Prueba Disponibles:**

#### 👩 Vaquita Marina

```json
{
  "userCode": "2023-119018",
  "password": "vaquita123"
}
```

**ID:** `de4cd964-3e8b-4552-b90a-1bd30cca2f21`

---

#### 👩 Cristhiany Conde

```json
{
  "userCode": "2022-124008",
  "password": "cristhiany123"
}
```

**ID:** `cc3d2b62-cd07-41f7-a3de-43ebf5be8eda`

---

#### 👩 Alicia Vera

```json
{
  "userCode": "2024-124031",
  "password": "alicia123"
}
```

**ID:** `d6f37f1a-f8ef-467a-b17f-5823603dd767`

---

#### 👩 Ariana Condori

```json
{
  "userCode": "2022-124009",
  "password": "ariana123"
}
```

**ID:** `a519fd27-825e-42dc-9ed0-95eacbdbb5e0`

---

#### 👨 Yusbel Mayta

```json
{
  "userCode": "2022-124010",
  "password": "yusbel123"
}
```

**ID:** `8fc76451-87b3-4ed6-83bb-b3db65842929`

---

**Respuesta Esperada:**

```json
{
  "message": "Login exitoso",
  "user": {
    "id": "de4cd964-3e8b-4552-b90a-1bd30cca2f21",
    "userCode": "2023-119018",
    "firstName": "Vaquita",
    "lastName": "Marina",
    "dni": "70801433",
    "email": "caflores@unjbg.edu.pe",
    "role": "estudiante"
  }
}
```

**⚠️ IMPORTANTE:** Después del login, las cookies se guardan automáticamente. Copia el `user.id` a la variable `user_id` en tu entorno.

---

### 3. Get Current User (GET)

**Endpoint:** `{{base_url}}/users/me`

**Headers:**

- Cookie: `accessToken=<token_from_login>`

**Respuesta Esperada:**

```json
{
  "id": "de4cd964-3e8b-4552-b90a-1bd30cca2f21",
  "userCode": "2023-119018",
  "firstName": "Vaquita",
  "lastName": "Marina",
  "dni": "70801433",
  "email": "caflores@unjbg.edu.pe",
  "role": "estudiante"
}
```

---

## 👥 Usuarios - Management

### 4. Get User by ID (GET)

**Endpoint:** `{{base_url}}/users/{{user_id}}`

**Headers:**

- Cookie: `accessToken=<token>`

**IDs de Prueba:**

- Vaquita Marina: `de4cd964-3e8b-4552-b90a-1bd30cca2f21`
- Cristhiany Conde: `cc3d2b62-cd07-41f7-a3de-43ebf5be8eda`
- Alicia Vera: `d6f37f1a-f8ef-467a-b17f-5823603dd767`

**Respuesta Esperada:**

```json
{
  "id_usuario": "de4cd964-3e8b-4552-b90a-1bd30cca2f21",
  "codigo_usuario": "2023-119018",
  "nombre": "Vaquita",
  "apellido": "Marina",
  "dni": "70801433",
  "email": "caflores@unjbg.edu.pe"
}
```

---

## 🎓 Estudiantes

### 5. Get Adult Patients by Student (GET)

**Endpoint:** `{{base_url}}/students/{{student_id}}/patients/adult`

**Headers:**

- Cookie: `accessToken=<token>`

**Student IDs de Prueba:**

- Vaquita Marina: `de4cd964-3e8b-4552-b90a-1bd30cca2f21`
- Cristhiany Conde: `cc3d2b62-cd07-41f7-a3de-43ebf5be8eda`
- Rodrigo Laura: `b8727ab2-4006-4a75-bf4a-bd7f9228288f`

**Respuesta Esperada:**

```json
[
  {
    "idPatient": "uuid-del-paciente",
    "idHistory": "uuid-de-historia",
    "name": "Juan Carlos Pérez García",
    "age": 38,
    "phone": "987654321",
    "email": "juan.perez@email.com",
    "gender": "Masculino",
    "lastUpdate": "2025-10-25T12:00:00.000Z"
  }
]
```

---

### 6. Create Patient (POST) 🆕

**Endpoint:** `{{base_url}}/patients`

**Headers:**

- Cookie: `accessToken=<token>`
- Content-Type: `application/json`

**Body (JSON):**

```json
{
  "nombre": "Juan",
  "apellido": "Pérez García",
  "dni": "98765432",
  "fechaNacimiento": "1985-03-15",
  "sexo": "Masculino",
  "telefono": "999888777",
  "email": "juan.perez@email.com"
}
```

**⚠️ Notas:**

- El campo `sexo` debe ser exactamente: `"Masculino"` o `"Femenino"` (con mayúscula inicial)
- El DNI debe ser único (8 dígitos)
- La función `fn_crear_paciente` convierte automáticamente el sexo al UUID del catálogo
- Solo crea el paciente, NO crea historia clínica

**Respuesta Esperada:**

```json
{
  "success": true,
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
```

**Errores Posibles:**

**400 Bad Request - Campos requeridos:**

```json
{
  "success": false,
  "error": "Los campos nombre, apellido, dni, fechaNacimiento y sexo son requeridos."
}
```

**400 Bad Request - Sexo inválido:**

```json
{
  "success": false,
  "error": "El sexo debe ser \"Masculino\" o \"Femenino\"."
}
```

**409 Conflict - DNI duplicado:**

```json
{
  "success": false,
  "error": "Ya existe un paciente con ese DNI."
}
```

---

## 📋 Historias Clínicas

### 7. Create Draft Historia (POST) 🆕

**Endpoint:** `{{base_url}}/hc/draft`

**Headers:**

- Cookie: `accessToken=<token>`

**Body:** Vacío (el backend usa el ID del estudiante del token JWT)

**Respuesta Esperada (200):**

```json
{
  "id_historia": "550e8400-e29b-41d4-a716-446655440000"
}
```

**⚠️ IMPORTANTE:**

- Si ya tienes un borrador activo, **devuelve el mismo ID** (no crea uno nuevo)
- Si es tu primer borrador, crea uno nuevo
- Esta historia está en estado 'borrador' sin paciente asignado
- Garantiza que cada estudiante tenga máximo un borrador a la vez

**Flujo recomendado:**

1. Llamar este endpoint (obtiene o crea borrador)
2. Navegar a `/historia/:id` en el frontend
3. Llenar formulario de paciente
4. Asignar paciente al borrador (endpoint #8)

---

### 8. Assign Patient to Draft (PATCH) 🆕

**Endpoint:** `{{base_url}}/hc/assign-patient`

**Headers:**

- Cookie: `accessToken=<token>`
- Content-Type: `application/json`

**Body (JSON):**

```json
{
  "idHistory": "550e8400-e29b-41d4-a716-446655440000",
  "idPatient": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
```

**Respuesta Esperada (200):**

```json
{
  "message": "Paciente asignado a la historia clinica"
}
```

**Errores Posibles:**

**400 Bad Request - Historia no válida:**

```json
{
  "error": "Historia clínica no encontrada o no está en estado borrador"
}
```

**400 Bad Request - Paciente ya tiene historia:**

```json
{
  "error": "El paciente ya tiene una historia clínica asignada"
}
```

**400 Bad Request - Paciente no existe:**

```json
{
  "error": "Paciente no encontrado"
}
```

**⚠️ Validaciones:**

- La historia debe existir y estar en estado 'borrador'
- El paciente debe existir
- El paciente NO debe tener otra historia asignada
- Al asignar, el estado cambia de 'borrador' a 'en_proceso'

---

### 9. Create Review (POST)

**Endpoint:** `{{base_url}}/hc/review`

**Headers:**

- Cookie: `accessToken=<token>`
- Content-Type: `application/json`

**Body (JSON):**

```json
{
  "idHistory": "<uuid-de-historia-clinica>",
  "idTeacher": "<uuid-del-profesor>",
  "state": "aprobado",
  "observations": "Historia clínica completa y bien documentada"
}
```

**Estados Válidos:**

- `pendiente`
- `aprobado`
- `rechazado`
- `revision`

**Respuesta Esperada (201):**

```json
{
  "message": "Revisión registrada exitosamente"
}
```

---

### 10. Get Patient by History ID (GET) 🆕

**Endpoint:** `{{base_url}}/hc/{{history_id}}/patient`

**Headers:**

- Cookie: `accessToken=<token>`

**Descripción:** Obtiene los datos del paciente asociado a una historia clínica específica.

**Respuesta Esperada (200):**

```json
{
  "id_paciente": "uuid-paciente",
  "dni": "12345678",
  "nombre": "Juan",
  "apellido": "Pérez García",
  "nombre_completo": "Juan Pérez García",
  "fecha_nacimiento": "1990-05-15",
  "edad": 35,
  "sexo": "Masculino",
  "telefono": "987654321",
  "email": "juan@example.com",
  "fecha_registro": "2025-10-20T10:30:00.000Z",
  "activo": true
}
```

**404 Not Found - Sin paciente:**

```json
{
  "error": "Paciente no encontrado o historia sin paciente asignado"
}
```

**💡 Casos de uso:**

- Mostrar datos del paciente en el header de `HcLayout`
- Validar si una historia tiene paciente antes de mostrar formularios
- Obtener datos para pre-llenar formularios de filiación

---

### 11. Get Filiación by History ID (GET)

**Endpoint:** `{{base_url}}/hc/{{history_id}}/filiacion`

**Headers:**

- Cookie: `accessToken=<token>`

**History IDs de Prueba:**
(Debes crearlos primero o consultarlos en la BD)

**Respuesta Esperada:**

```json
{
  "id_filiacion": "uuid-filiacion",
  "id_historia": "uuid-historia",
  "raza": "Mestizo",
  "fecha_nacimiento": "1985-03-15",
  "lugar": "Tacna",
  "estado_civil": "Soltero",
  "nombre_conyuge": null,
  "ocupacion": "Empleado",
  "lugar_procedencia": "Tacna",
  "tiempo_residencia_tacna": "30 años",
  "domicilio": "Av. Principal 123",
  "telefono": "987654321",
  "familiares_nombre": "María Pérez",
  "familiares_relacion": "Madre",
  "familiares_telefono": "987654320",
  "ultima_visita_odontologo": "2024-06-15",
  "motivo_ultima_visita_odontologo": "Control",
  "ultima_visita_medico": "2024-08-20",
  "motivo_ultima_visita_medico": "Chequeo anual"
}
```

---

## 📝 Notas Importantes

### 🔐 Autenticación

- Todos los endpoints (excepto register y login) requieren autenticación
- El token se envía automáticamente en cookies después del login
- En Insomnia, habilita la opción "Send cookies automatically"

### 🍪 Cookies

Después del login, se establecen dos cookies:

- `accessToken` - Token de acceso (expires: 15min)
- `refreshToken` - Token de refresco (expires: 7d)

### 🔄 Refresh Token

Si el accessToken expira, el backend lo renueva automáticamente usando el refreshToken.

### 📊 Datos de Prueba

#### Usuarios Estudiantes (15 disponibles)

```
1.  2023-119018 - Vaquita Marina
2.  2022-124008 - Cristhiany Conde
3.  2024-124031 - Alicia Vera
4.  2022-124009 - Ariana Condori
5.  2022-124010 - Yusbel Mayta
6.  2021-124021 - Nicolett Cahuana
7.  2022-124003 - Rodrigo Laura
8.  2021-124030 - Mariela Castro
9.  2021-124035 - Joselyn Cori
10. 2022-124005 - Nilo Sinticala
11. 2022-124018 - Kendra Vilca
12. 2021-124043 - Henry Ortega
13. 2022-124013 - Mirian Mamani
14. 2011124008  - Samuel Rojas
15. 2021-124024 - Veronica Garcia
```

**Contraseña por defecto:** Consultar con el administrador o ver seeds

#### Pacientes (50 disponibles)

- 25 Masculinos (DNI: 12345678 - 60616263)
- 25 Femeninos (DNI: 12345679 - 60616264)

**Ejemplos:**

```
• Juan Carlos Pérez García    - DNI: 12345678 - M
• María Elena García Fernández - DNI: 12345679 - F
• Luis Alberto Rodríguez Silva - DNI: 23456789 - M
• Ana Lucía Rodríguez Pérez    - DNI: 23456780 - F
```

---

## 🧪 Flujo de Testing Recomendado

### Test #1: Authentication Flow

1. ✅ POST `/users/register` - Registrar nuevo usuario
2. ✅ POST `/users/login` - Login con usuario creado
3. ✅ GET `/users/me` - Verificar sesión actual
4. ✅ GET `/users/:id` - Obtener usuario por ID

### Test #2: Student Flow

1. ✅ POST `/users/login` - Login como estudiante
2. ✅ GET `/students/:id/patients/adult` - Ver pacientes asignados
3. ✅ POST `/students/:id/patients` - Registrar nuevo paciente

### Test #3: Historia Clínica Flow (Draft → Create Patient → Assign) 🆕

1. ✅ POST `/users/login` - Login como estudiante
2. ✅ POST `/hc/draft` - Crear borrador de HC (guardar id_historia)
3. ✅ POST `/patients` - Crear paciente (guardar id_paciente retornado)
4. ✅ PATCH `/hc/assign-patient` - Asignar paciente al borrador
5. ✅ GET `/hc/:id/filiacion` - Verificar historia completa

### Test #4: Review Flow

1. ✅ POST `/users/login` - Login como estudiante/profesor
2. ✅ POST `/hc/review` - Crear revisión de HC
3. ✅ GET `/hc/:id/filiacion` - Obtener filiación

---

## ⚠️ Errores Comunes

### 401 Unauthorized

**Causa:** No estás autenticado o el token expiró  
**Solución:** Hacer login nuevamente

### 404 Not Found

**Causa:** El ID proporcionado no existe  
**Solución:** Verificar el UUID en la base de datos

### 409 Conflict

**Causa:** Datos duplicados (ej: DNI ya existe)  
**Solución:** Usar datos únicos

### 500 Internal Server Error

**Causa:** Error en la función/procedure de BD  
**Solución:** Revisar logs del servidor y BD

---

## 📦 Colección de Insomnia

Para importar todos los endpoints de una vez, usa este JSON:

```json
{
  "name": "HC Backend API",
  "description": "Sistema de Historias Clínicas - Testing",
  "_type": "export",
  "resources": [
    {
      "name": "Users",
      "requests": [
        {
          "name": "Register",
          "method": "POST",
          "url": "{{ base_url }}/users/register",
          "body": {
            "mimeType": "application/json",
            "text": "{\n  \"userCode\": \"2025-999999\",\n  \"firstName\": \"Test\",\n  \"lastName\": \"Usuario\",\n  \"dni\": \"99999999\",\n  \"email\": \"test@unjbg.edu.pe\",\n  \"role\": \"estudiante\",\n  \"password\": \"TestPassword123!\"\n}"
          }
        },
        {
          "name": "Login",
          "method": "POST",
          "url": "{{ base_url }}/users/login",
          "body": {
            "mimeType": "application/json",
            "text": "{\n  \"userCode\": \"2023-119018\",\n  \"password\": \"vaquita123\"\n}"
          }
        },
        {
          "name": "Get Me",
          "method": "GET",
          "url": "{{ base_url }}/users/me"
        },
        {
          "name": "Get User by ID",
          "method": "GET",
          "url": "{{ base_url }}/users/{{ user_id }}"
        }
      ]
    },
    {
      "name": "Students",
      "requests": [
        {
          "name": "Get Adult Patients",
          "method": "GET",
          "url": "{{ base_url }}/students/{{ student_id }}/patients/adult"
        },
        {
          "name": "Register Patient",
          "method": "POST",
          "url": "{{ base_url }}/students/{{ student_id }}/patients",
          "body": {
            "mimeType": "application/json",
            "text": "{\n  \"nombreCompleto\": \"Test Paciente\",\n  \"edad\": 35,\n  \"idSexo\": \"<uuid>\",\n  \"telefono\": \"999888777\",\n  \"email\": \"test@email.com\"\n}"
          }
        }
      ]
    },
    {
      "name": "Patients",
      "requests": [
        {
          "name": "Create Patient",
          "method": "POST",
          "url": "{{ base_url }}/patients",
          "body": {
            "mimeType": "application/json",
            "text": "{\n  \"nombre\": \"Juan\",\n  \"apellido\": \"Pérez García\",\n  \"dni\": \"98765432\",\n  \"fechaNacimiento\": \"1985-03-15\",\n  \"sexo\": \"Masculino\",\n  \"telefono\": \"999888777\",\n  \"email\": \"juan.perez@email.com\"\n}"
          }
        }
      ]
    },
    {
      "name": "Historia Clinica",
      "requests": [
        {
          "name": "Create Draft",
          "method": "POST",
          "url": "{{ base_url }}/hc/draft",
          "body": {
            "mimeType": "application/json",
            "text": ""
          }
        },
        {
          "name": "Assign Patient to Draft",
          "method": "PATCH",
          "url": "{{ base_url }}/hc/assign-patient",
          "body": {
            "mimeType": "application/json",
            "text": "{\n  \"idHistory\": \"<uuid-historia>\",\n  \"idPatient\": \"<uuid-paciente>\"\n}"
          }
        },
        {
          "name": "Create Review",
          "method": "POST",
          "url": "{{ base_url }}/hc/review",
          "body": {
            "mimeType": "application/json",
            "text": "{\n  \"idHistory\": \"<uuid>\",\n  \"idTeacher\": \"<uuid>\",\n  \"state\": \"aprobado\",\n  \"observations\": \"OK\"\n}"
          }
        },
        {
          "name": "Get Filiacion",
          "method": "GET",
          "url": "{{ base_url }}/hc/{{ history_id }}/filiacion"
        }
      ]
    }
  ]
}
```

---

## 🎯 Checklist de Testing

- [ ] Registro de usuario nuevo
- [ ] Login exitoso
- [ ] Login fallido (credenciales incorrectas)
- [ ] Acceso a endpoint protegido sin token
- [ ] Acceso a endpoint protegido con token
- [ ] Obtener usuario por ID
- [ ] Obtener pacientes adultos de estudiante
- [ ] 🆕 Crear paciente (POST /patients)
- [ ] 🆕 Crear borrador de historia clínica
- [ ] 🆕 Asignar paciente a borrador
- [ ] 🆕 Intentar asignar paciente que ya tiene historia (debe fallar)
- [ ] 🆕 Intentar asignar a historia que no es borrador (debe fallar)
- [ ] Crear revisión de historia clínica
- [ ] Obtener filiación de historia clínica
- [ ] Verificar expiración de token
- [ ] Verificar refresh de token automático

---

**¡Feliz Testing!** 🚀
