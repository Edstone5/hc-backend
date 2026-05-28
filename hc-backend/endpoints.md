# Documentación de Endpoints - HC Backend

## Usuarios (`/api/users`)

.....

### 1. POST `/api/users/register`

**Descripción:** Registra un nuevo usuario en el sistema.

**Query SQL:**

```sql
CALL i_usuario($1, $2, $3, $4, $5, $6, $7)
```

**Parámetros:**

- `$1`: userCode
- `$2`: firstName
- `$3`: lastName
- `$4`: dni
- `$5`: email
- `$6`: role
- `$7`: hashedPassword

---

### 2. POST `/api/users/login`

**Descripción:** Inicia sesión de un usuario y genera tokens de autenticación.

**Query SQL:**

```sql
SELECT * FROM fn_obtener_usuario_login($1)
```

**Parámetros:**

- `$1`: userCode

---

### 3. GET `/api/users/me`

**Descripción:** Obtiene la información del usuario actual autenticado.

**Middleware:** Requiere autenticación (`authMiddleware`)

**Query SQL:** No ejecuta query directa (retorna datos del middleware)

---

### 4. GET `/api/users/:id`

**Descripción:** Obtiene un usuario por su ID.

**Middleware:** Requiere autenticación (`authMiddleware`)

**Query SQL:**

```sql
SELECT * FROM fn_obtener_usuario($1)
```

**Parámetros:**

- `$1`: id (ID del usuario)

---

### 5. GET `/api/users`

**Descripción:** Obtiene todos los usuarios (para administradores).

**Middleware:** Requiere autenticación (`authMiddleware`)

**Query SQL:** No especificada en el modelo (método `getAll` no está implementado en UserModel)

---

## Historias Clínicas (`/api/hc`)

### 6. POST `/api/hc/review`

**Descripción:** Crea una revisión de historia clínica.

**Query SQL:**

```sql
CALL i_revision_historia($1, $2, $3, $4)
```

**Parámetros:**

- `$1`: idHistory
- `$2`: idTeacher
- `$3`: state
- `$4`: observations

---

### 7. GET `/api/hc/:id/filiacion`

**Descripción:** Obtiene la filiación de una historia clínica por su ID.

**Query SQL:**

```sql
SELECT * FROM fn_obtener_filiacion($1)
```

**Parámetros:**

- `$1`: idHistory (ID de la historia clínica)

---

### 8. POST `/api/hc/draft`

**Descripción:** Crea un nuevo borrador de historia clínica o devuelve uno existente para el estudiante autenticado.

**Middleware:** Requiere autenticación (`verifyToken`)

**Query SQL:**

```sql
SELECT fn_obtener_o_crear_borrador($1) AS id_historia
```

**Parámetros:**

- `$1`: idStudent (obtenido del token JWT - `req.user.id`)

**Body:** Vacío (el backend usa el ID del estudiante del token JWT)

**Lógica:**

1. Busca si ya existe un borrador con `estado='borrador'` para el estudiante
2. Si existe, devuelve su `id_historia`
3. Si no existe, crea uno nuevo y devuelve su `id_historia`
4. Garantiza que cada estudiante tenga máximo un borrador a la vez

**Respuesta Exitosa (200):**

```json
{
  "id_historia": "uuid-generado-o-existente"
}
```

**Respuesta Error (500):**

```json
{
  "error": "Error al crear historia clinica en borrador"
}
```

---

### 9. PATCH `/api/hc/assign-patient`

**Descripción:** Asigna un paciente a una historia clínica en borrador y cambia su estado a 'en_proceso'.

**Middleware:** Requiere autenticación (`verifyToken`)

**Query SQL:**

```sql
SELECT fn_asignar_paciente_a_historia($1, $2)
```

**Parámetros:**

- `$1`: idHistory (UUID de la historia clínica)
- `$2`: idPatient (UUID del paciente)

**Body:**

```json
{
  "idHistory": "uuid-historia",
  "idPatient": "uuid-paciente"
}
```

**Validaciones:**

- Historia debe existir y estar en estado 'borrador'
- Paciente debe existir
- Paciente no debe tener otra historia asignada

**Respuesta Exitosa (200):**

```json
{
  "message": "Paciente asignado a la historia clinica"
}
```

**Respuesta Error (400):**

```json
{
  "error": "Historia clínica no encontrada o no está en estado borrador"
}
```

**Respuesta Error (500):**

```json
{
  "error": "Error al asignar paciente a la historia"
}
```

---

### 10. GET `/api/hc/:id/patient`

**Descripción:** Obtiene los datos completos del paciente asociado a una historia clínica.

**Middleware:** Requiere autenticación (`verifyToken`)

**Query SQL:**

```sql
SELECT * FROM fn_obtener_paciente_por_historia($1)
```

**Parámetros:**

- `:id` - UUID de la historia clínica (en la URL)

**Respuesta Exitosa (200):**

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

**Respuesta Error (404):**

```json
{
  "error": "Paciente no encontrado o historia sin paciente asignado"
}
```

**Respuesta Error (500):**

```json
{
  "error": "Error al obtener datos del paciente"
}
```

**Nota:** Este endpoint es útil para obtener los datos del paciente cuando solo tienes el ID de la historia clínica, especialmente en el layout de la historia donde necesitas mostrar el nombre del paciente.

---

## Pacientes (`/api/patients`)

### 8. GET `/api/students/:id/patients/adult`

**Descripción:** Obtiene todos los pacientes adultos asociados a un estudiante.

**Query SQL:**

```sql
SELECT * FROM fn_obtener_pacientes_adultos($1)
```

**Parámetros:**

- `$1`: studentId (ID del estudiante)

**Respuesta:** Mapea los resultados a:

- `idPatient`: id_paciente
- `idHistory`: id_historia
- `name`: nombre_completo
- `age`: edad
- `phone`: telefono
- `email`: email
- `gender`: sexo
- `lastUpdate`: ultima_modificacion

---

### 9. POST `/api/students/:studentId/patients`

**Descripción:** Registra un nuevo paciente y lo asocia a un estudiante.

**Queries SQL:**

```sql
-- Inserta el paciente
INSERT INTO paciente (nombre_completo, edad, id_sexo, telefono, email)
VALUES ($1, $2, $3, $4, $5)
RETURNING *

-- Crea la historia clínica
INSERT INTO historia_clinica (id_paciente, id_estudiante)
VALUES ($1, $2)
```

**Parámetros (Primera query):**

- `$1`: nombreCompleto
- `$2`: edad
- `$3`: idSexo
- `$4`: telefono
- `$5`: email

**Parámetros (Segunda query):**

- `$1`: id_paciente (del paciente recién creado)
- `$2`: studentId

---

## Pacientes (`/api/patients`)

### 10. POST `/api/patients`

**Descripción:** Crea un nuevo paciente en el sistema usando la función `fn_crear_paciente`.

**Middleware:** Requiere autenticación (`verifyToken`)

**Query SQL:**

```sql
SELECT fn_crear_paciente($1, $2, $3, $4, $5, $6, $7) AS id_paciente
```

**Parámetros:**

- `$1`: nombre (VARCHAR(200))
- `$2`: apellido (VARCHAR(200))
- `$3`: dni (CHAR(8), único)
- `$4`: fechaNacimiento (DATE)
- `$5`: sexo ('Masculino' o 'Femenino')
- `$6`: telefono (VARCHAR(20), opcional)
- `$7`: email (VARCHAR(200), opcional)

**Body:**

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

**Validaciones:**

- Campos requeridos: nombre, apellido, dni, fechaNacimiento, sexo
- Sexo debe ser exactamente "Masculino" o "Femenino"
- DNI debe ser único en la base de datos

**Respuesta Exitosa (201):**

```json
{
  "id": "uuid-del-paciente-creado"
}
```

**Respuesta Error (400):**

```json
{
  "error": "Los campos nombre, apellido, dni, fechaNacimiento y sexo son requeridos."
}
```

**Respuesta Error (409) - DNI duplicado:**

```json
{
  "error": "Ya existe un paciente con ese DNI."
}
```

**Respuesta Error (500):**

```json
{
  "error": "Error al crear paciente."
}
```

**Nota:** Este endpoint solo crea el paciente, NO crea una historia clínica asociada. Para asociar un paciente a una historia, usar el flujo de borrador (POST `/hc/draft` + PATCH `/hc/assign-patient`).

---

## Resumen de Funciones SQL Utilizadas

### Funciones de Selección (SELECT)

- `fn_obtener_usuario($1)` - Selecciona un usuario por ID
- `fn_obtener_usuario_login($1)` - Selecciona un usuario para login por userCode
- `fn_obtener_filiacion($1)` - Selecciona la filiación de una historia clínica
- `fn_obtener_pacientes_adultos($1)` - Selecciona pacientes adultos de un estudiante
- `fn_crear_paciente($1, $2, $3, $4, $5, $6, $7)` - Crea un paciente y retorna su UUID
- `fn_obtener_o_crear_borrador($1)` - Obtiene borrador existente o crea uno nuevo
- `fn_asignar_paciente_a_historia($1, $2)` - Asigna paciente a historia y retorna BOOLEAN
- `fn_obtener_paciente_por_historia($1)` - Obtiene datos del paciente asociado a una historia

### Procedimientos Almacenados (CALL)

- `i_usuario($1, $2, $3, $4, $5, $6, $7)` - Inserta un nuevo usuario
- `i_revision_historia($1, $2, $3, $4)` - Inserta una revisión de historia
- `i_paciente($1, $2, $3, $4, $5, $6, $7)` - Inserta paciente (usado en seeds)

### Queries SQL Directas

- `INSERT INTO paciente (...)` - Inserta un paciente
- `INSERT INTO historia_clinica (...)` - Inserta una historia clínica

---

## Notas Importantes

1. **Autenticación:** Los siguientes endpoints requieren autenticación mediante `authMiddleware`:
   - `GET /api/users/me`
   - `GET /api/users/:id`
   - `GET /api/users`

2. **Tokens:** El login genera tokens JWT (accessToken y refreshToken) que se almacenan en cookies.

3. **Validación de Contraseñas:** El registro de usuarios valida la contraseña usando `validatePasswd` del schema.

4. **Hashing:** Las contraseñas se hashean usando Argon2.

5. **UUID:** Los IDs de estudiantes se validan como UUID de 36 caracteres.

6. **Método no implementado:** El método `getAll()` en UserController no tiene implementación en el UserModel.
