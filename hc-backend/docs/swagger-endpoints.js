/**
 * @swagger
 * /api/student-users:
 *   get:
 *     tags:
 *       - Usuarios Estudiantes
 *     summary: Obtiene la lista de todos los usuarios estudiantes
 *     responses:
 *       200:
 *         description: Lista de usuarios estudiantes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "e1a2b3c4-d5f6-7890-abcd-1234567890ab"
 *                   nombre:
 *                     type: string
 *                     example: "Juan"
 *                   apellido:
 *                     type: string
 *                     example: "Pérez"
 *                   email:
 *                     type: string
 *                     example: "juan.perez@unjbg.edu.pe"
 */

/**
 * @swagger
 * /api/students/{id}/patients/adult:
 *   get:
 *     tags:
 *       - Estudiantes
 *     summary: Obtiene los pacientes adultos asignados a un estudiante
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID del estudiante
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes adultos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
 *                   nombre:
 *                     type: string
 *                     example: "Carlos"
 *                   apellido:
 *                     type: string
 *                     example: "Ramírez"
 *                   edad:
 *                     type: integer
 *                     example: 45
 *                   sexo:
 *                     type: string
 *                     example: "Masculino"
 *                   telefono:
 *                     type: string
 *                     example: "999888777"
 *                   email:
 *                     type: string
 *                     example: "carlos.ramirez@unjbg.edu.pe"
 *       400:
 *         description: ID de estudiante inválido
 */

/**
 * @swagger
 * /api/pacientes:
 *   post:
 *     tags:
 *       - Pacientes
 *     summary: Crea un nuevo paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Ana"
 *               apellido:
 *                 type: string
 *                 example: "García"
 *               dni:
 *                 type: string
 *                 example: "12345678"
 *               fechaNacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1980-05-12"
 *               sexo:
 *                 type: string
 *                 example: "Femenino"
 *               telefono:
 *                 type: string
 *                 example: "987654321"
 *               email:
 *                 type: string
 *                 example: "ana.garcia@unjbg.edu.pe"
 *     responses:
 *       201:
 *         description: Paciente creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "b1c2d3e4-f5a6-7890-abcd-1234567890ab"
 *       400:
 *         description: Campos requeridos faltantes o sexo inválido
 *       409:
 *         description: Ya existe un paciente con ese DNI
 *       500:
 *         description: Error al crear paciente
 */

/**
 * @swagger
 * /api/pacientes/{id}:
 *   put:
 *     tags:
 *       - Pacientes
 *     summary: Actualiza los datos de un paciente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Ana"
 *               apellido:
 *                 type: string
 *                 example: "García"
 *               telefono:
 *                 type: string
 *                 example: "987654321"
 *               email:
 *                 type: string
 *                 example: "ana.garcia@unjbg.edu.pe"
 *     responses:
 *       200:
 *         description: Datos del paciente actualizados correctamente
 *       400:
 *         description: ID de paciente inválido
 *       404:
 *         description: Paciente no encontrado
 *       500:
 *         description: Error interno al actualizar el paciente
 */
/**
 * @swagger
 * /api/hc/antecedente-personal/historia/{id_historia}:
 *   get:
 *     tags:
 *       - Antecedente Personal
 *     summary: Obtiene el antecedente personal por historia
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del antecedente personal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_historia:
 *                   type: string
 *                   example: "e1a2b3c4-d5f6-7890-abcd-1234567890ab"
 *                 esta_embarazada:
 *                   type: boolean
 *                   example: false
 *                 mac:
 *                   type: string
 *                   example: "N/A"
 *                 otros:
 *                   type: string
 *                   example: "Sin antecedentes"
 *                 psicosocial:
 *                   type: string
 *                   example: "Normal"
 *                 vacunas:
 *                   type: string
 *                   example: "Completo"
 *                 hepatitis_b:
 *                   type: boolean
 *                   example: false
 *                 id_grupo_sanguineo:
 *                   type: string
 *                   description: UUID que referencia el grupo sanguíneo
 *                   example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
 *                 fuma:
 *                   type: boolean
 *                   example: false
 *                 cigarrillos_dia:
 *                   type: integer
 *                   example: 0
 *                 toma_te:
 *                   type: boolean
 *                   example: true
 *                 tazas_te_dia:
 *                   type: integer
 *                   example: 2
 *                 toma_alcohol:
 *                   type: boolean
 *                   example: false
 *                 frecuencia_alcohol:
 *                   type: string
 *                   example: ""
 *                 aprieta_dientes:
 *                   type: boolean
 *                   example: false
 *                 momento_aprieta:
 *                   type: string
 *                   example: ""
 *                 rechina:
 *                   type: boolean
 *                   example: false
 *                 dolor_muscular:
 *                   type: boolean
 *                   example: false
 *                 chupa_dedo:
 *                   type: boolean
 *                   example: false
 *                 muerde_objetos:
 *                   type: boolean
 *                   example: false
 *                 muerde_labios:
 *                   type: boolean
 *                   example: false
 *                 otros_habitos:
 *                   type: string
 *                   example: ""
 *                 frecuencia_cepillado:
 *                   type: integer
 *                   example: 2
 *       404:
 *         description: No encontrado
 */
/**
 * @swagger
 * /api/hc/motivo-consulta:
 *   post:
 *     tags:
 *       - Motivo de Consulta
 *     summary: Crea un motivo de consulta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_historia:
 *                 type: string
 *                 example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *               motivo:
 *                 type: string
 *                 example: "Dolor de cabeza"
 *     responses:
 *       201:
 *         description: Motivo de consulta creado con éxito
 *       400:
 *         description: Error en los datos enviados
 *
 * @swagger
 * /api/hc/motivo-consulta/historia/{id_historia}:
 *   get:
 *     tags:
 *       - Motivo de Consulta
 *     summary: Obtiene el motivo de consulta por historia clínica
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Motivo de consulta obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_motivo:
 *                   type: string
 *                   example: "d1e2f3a4-b5c6-7890-abcd-1234567890ab"
 *                 id_historia:
 *                   type: string
 *                   example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *                 motivo:
 *                   type: string
 *                   example: "Dolor de cabeza"
 *       404:
 *         description: No se encontró motivo de consulta para la historia clínica indicada
 *
 *   put:
 *     tags:
 *       - Motivo de Consulta
 *     summary: Actualiza el motivo de consulta por historia clínica
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *                 example: "Dolor de cabeza y mareos casi siempre"
 *     responses:
 *       200:
 *         description: Motivo de consulta actualizado correctamente
 *       404:
 *         description: No se encontró motivo de consulta para la historia clínica indicada
 *       500:
 *         description: Error al actualizar el motivo de consulta
 */
/**
 * @swagger
 * /api/hc/antecedente-personal/historia/{id_historia}:
 *   put:
 *     tags:
 *       - Antecedente Personal
 *     summary: Actualiza el antecedente personal por historia
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               esta_embarazada:
 *                 type: boolean
 *                 example: false
 *               mac:
 *                 type: string
 *                 example: "N/A"
 *               otros:
 *                 type: string
 *                 example: "Sin antecedentes"
 *               psicosocial:
 *                 type: string
 *                 example: "Normal"
 *               vacunas:
 *                 type: string
 *                 example: "Completo"
 *               hepatitis_b:
 *                 type: boolean
 *                 example: false
 *               id_grupo_sanguineo:
 *                 type: string
 *                 description: UUID que referencia el grupo sanguíneo
 *                 example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
 *               fuma:
 *                 type: boolean
 *                 example: false
 *               cigarrillos_dia:
 *                 type: integer
 *                 example: 0
 *               toma_te:
 *                 type: boolean
 *                 example: true
 *               tazas_te_dia:
 *                 type: integer
 *                 example: 2
 *               toma_alcohol:
 *                 type: boolean
 *                 example: false
 *               frecuencia_alcohol:
 *                 type: string
 *                 example: ""
 *               aprieta_dientes:
 *                 type: boolean
 *                 example: false
 *               momento_aprieta:
 *                 type: string
 *                 example: ""
 *               rechina:
 *                 type: boolean
 *                 example: false
 *               dolor_muscular:
 *                 type: boolean
 *                 example: false
 *               chupa_dedo:
 *                 type: boolean
 *                 example: false
 *               muerde_objetos:
 *                 type: boolean
 *                 example: false
 *               muerde_labios:
 *                 type: boolean
 *                 example: false
 *               otros_habitos:
 *                 type: string
 *                 example: ""
 *               frecuencia_cepillado:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Antecedente personal actualizado
 *       404:
 *         description: No encontrado
 */
/**
 * @swagger
 * /api/hc/antecedente-personal:
 *   post:
 *     tags:
 *       - Antecedente Personal
 *     summary: Crea un antecedente personal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_historia:
 *                 type: string
 *                 example: "e1a2b3c4-d5f6-7890-abcd-1234567890ab"
 *               esta_embarazada:
 *                 type: boolean
 *                 example: false
 *               mac:
 *                 type: string
 *                 example: "N/A"
 *               otros:
 *                 type: string
 *                 example: "Sin antecedentes"
 *               psicosocial:
 *                 type: string
 *                 example: "Normal"
 *               vacunas:
 *                 type: string
 *                 example: "Completo"
 *               hepatitis_b:
 *                 type: boolean
 *                 example: false
 *               id_grupo_sanguineo:
 *                 type: string
 *                 description: UUID que referencia el grupo sanguíneo
 *                 example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
 *               fuma:
 *                 type: boolean
 *                 example: false
 *               cigarrillos_dia:
 *                 type: integer
 *                 example: 0
 *               toma_te:
 *                 type: boolean
 *                 example: true
 *               tazas_te_dia:
 *                 type: integer
 *                 example: 2
 *               toma_alcohol:
 *                 type: boolean
 *                 example: false
 *               frecuencia_alcohol:
 *                 type: string
 *                 example: ""
 *               aprieta_dientes:
 *                 type: boolean
 *                 example: false
 *               momento_aprieta:
 *                 type: string
 *                 example: ""
 *               rechina:
 *                 type: boolean
 *                 example: false
 *               dolor_muscular:
 *                 type: boolean
 *                 example: false
 *               chupa_dedo:
 *                 type: boolean
 *                 example: false
 *               muerde_objetos:
 *                 type: boolean
 *                 example: false
 *               muerde_labios:
 *                 type: boolean
 *                 example: false
 *               otros_habitos:
 *                 type: string
 *                 example: ""
 *               frecuencia_cepillado:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Antecedente personal creado
 */
/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registra un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userCode:
 *                 type: string
 *                 example: "2023-119018"
 *               password:
 *                 type: string
 *                 example: "vaqMar12@"
 *               firstName:
 *                 type: string
 *                 example: "Vaquita"
 *               lastName:
 *                 type: string
 *                 example: "Marina"
 *               email:
 *                 type: string
 *                 example: "caflores@unjbg.edu.pe"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos inválidos o usuario ya existe
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Obtiene los datos del usuario autenticado
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userCode:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: No autenticado
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Obtiene los datos de un usuario por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userCode:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Obtiene la lista de todos los usuarios
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userCode:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 */
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Inicia sesión y obtiene los datos del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userCode:
 *                 type: string
 *                 example: "2023-119018"
 *               password:
 *                 type: string
 *                 example: "vaqMar12@"
 *     responses:
 *       200:
 *         description: Login exitoso, retorna los datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "de4cd964-3e8b-4552-b90a-1bd30cca2f21"
 *                 userCode:
 *                   type: string
 *                   example: "2023-119018"
 *                 firstName:
 *                   type: string
 *                   example: "Vaquita"
 *                 lastName:
 *                   type: string
 *                   example: "Marina"
 *                 email:
 *                   type: string
 *                   example: "caflores@unjbg.edu.pe"
 *                 role:
 *                   type: string
 *                   example: "estudiante"
 *       401:
 *         description: Credenciales inválidas
 */
/**
 * @swagger
 * /api/hc/enfermedad-actual:
 *   post:
 *     tags:
 *       - Enfermedad Actual
 *     summary: Crea una enfermedad actual
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_historia:
 *                 type: string
 *                 example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *               sintoma_principal:
 *                 type: string
 *                 example: "Fiebre"
 *               tiempo_enfermedad:
 *                 type: string
 *                 example: "3 días"
 *               forma_inicio:
 *                 type: string
 *                 example: "Brusco"
 *               curso:
 *                 type: string
 *                 example: "Progresivo"
 *               relato:
 *                 type: string
 *                 example: "Paciente refiere fiebre alta y malestar general."
 *               tratamiento_prev:
 *                 type: string
 *                 example: "Paracetamol"
 *     responses:
 *       201:
 *         description: Enfermedad actual registrada con éxito
 *       400:
 *         description: Error en los datos enviados
 */
/**
 * @swagger
 * /api/hc/enfermedad-actual/historia/{id_historia}:
 *   get:
 *     tags:
 *       - Enfermedad Actual
 *     summary: Obtiene la enfermedad actual por historia clínica
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Enfermedad actual obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_historia:
 *                   type: string
 *                   example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *                 sintoma_principal:
 *                   type: string
 *                   example: "Fiebre"
 *                 tiempo_enfermedad:
 *                   type: string
 *                   example: "3 días"
 *                 forma_inicio:
 *                   type: string
 *                   example: "Brusco"
 *                 curso:
 *                   type: string
 *                   example: "Progresivo"
 *                 relato:
 *                   type: string
 *                   example: "Paciente refiere fiebre alta y malestar general."
 *                 tratamiento_prev:
 *                   type: string
 *                   example: "Paracetamol"
 *       404:
 *         description: No se encontró enfermedad actual para la historia clínica indicada
 */
/**
 * @swagger
 * /api/hc/enfermedad-actual/historia/{id_historia}:
 *   put:
 *     tags:
 *       - Enfermedad Actual
 *     summary: Actualiza la enfermedad actual por historia clínica
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sintoma_principal:
 *                 type: string
 *                 example: "Fiebre y tos"
 *               tiempo_enfermedad:
 *                 type: string
 *                 example: "4 días"
 *               forma_inicio:
 *                 type: string
 *                 example: "Brusco"
 *               curso:
 *                 type: string
 *                 example: "Progresivo"
 *               relato:
 *                 type: string
 *                 example: "Paciente refiere fiebre alta, malestar general y tos seca."
 *               tratamiento_prev:
 *                 type: string
 *                 example: "Paracetamol y jarabe"
 *     responses:
 *       200:
 *         description: Enfermedad actual actualizada correctamente
 *       404:
 *         description: No se encontró enfermedad actual para la historia clínica indicada
 *       500:
 *         description: Error al actualizar la enfermedad actual
 */
/**
 * @swagger
 * /api/hc/filiacion:
 *   post:
 *     tags:
 *       - Filiación
 *     summary: Crea una filiación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_historia:
 *                 type: string
 *                 example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *               raza:
 *                 type: string
 *                 example: "Mestizo"
 *               fecha_nacimiento:
 *                 type: string
 *                 example: "1990-01-01"
 *               lugar:
 *                 type: string
 *                 example: "Tacna"
 *               estado_civil:
 *                 type: string
 *                 example: "Soltero"
 *               nombre_conyuge:
 *                 type: string
 *                 example: "N/A"
 *               ocupacion:
 *                 type: string
 *                 example: "Estudiante"
 *               lugar_procedencia:
 *                 type: string
 *                 example: "Tacna"
 *               tiempo_residencia_tacna:
 *                 type: string
 *                 example: "10 años"
 *               direccion:
 *                 type: string
 *                 example: "Av. Ejemplo 123"
 *               ultima_visita_dentista:
 *                 type: string
 *                 example: "2023-01-01"
 *               motivo_visita_dentista:
 *                 type: string
 *                 example: "Control"
 *               ultima_visita_medico:
 *                 type: string
 *                 example: "2023-02-01"
 *               motivo_visita_medico:
 *                 type: string
 *                 example: "Resfrío"
 *               contacto_emergencia:
 *                 type: string
 *                 example: "Madre"
 *               telefono_emergencia:
 *                 type: string
 *                 example: "999888777"
 *               acompaniante:
 *                 type: string
 *                 example: "Hermano"
 *               edad:
 *                 type: integer
 *                 example: 22
 *               sexo:
 *                 type: string
 *                 example: "Masculino"
 *               fecha_elaboracion:
 *                 type: string
 *                 example: "2023-12-01"
 *     responses:
 *       201:
 *         description: Filiación registrada con éxito
 *       400:
 *         description: Error en los datos enviados
 */
/**
 * @swagger
 * /api/hc/filiacion/historia/{id_historia}:
 *   get:
 *     tags:
 *       - Filiación
 *     summary: Obtiene la filiación por historia clínica
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Filiación obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_historia:
 *                   type: string
 *                   example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *                 raza:
 *                   type: string
 *                   example: "Mestizo"
 *                 fecha_nacimiento:
 *                   type: string
 *                   example: "1990-01-01"
 *                 lugar:
 *                   type: string
 *                   example: "Tacna"
 *                 estado_civil:
 *                   type: string
 *                   example: "Soltero"
 *                 nombre_conyuge:
 *                   type: string
 *                   example: "N/A"
 *                 ocupacion:
 *                   type: string
 *                   example: "Estudiante"
 *                 lugar_procedencia:
 *                   type: string
 *                   example: "Tacna"
 *                 tiempo_residencia_tacna:
 *                   type: string
 *                   example: "10 años"
 *                 direccion:
 *                   type: string
 *                   example: "Av. Ejemplo 123"
 *                 ultima_visita_dentista:
 *                   type: string
 *                   example: "2023-01-01"
 *                 motivo_visita_dentista:
 *                   type: string
 *                   example: "Control"
 *                 ultima_visita_medico:
 *                   type: string
 *                   example: "2023-02-01"
 *                 motivo_visita_medico:
 *                   type: string
 *                   example: "Resfrío"
 *                 contacto_emergencia:
 *                   type: string
 *                   example: "Madre"
 *                 telefono_emergencia:
 *                   type: string
 *                   example: "999888777"
 *                 acompaniante:
 *                   type: string
 *                   example: "Hermano"
 *                 edad:
 *                   type: integer
 *                   example: 22
 *                 sexo:
 *                   type: string
 *                   example: "Masculino"
 *                 fecha_elaboracion:
 *                   type: string
 *                   example: "2023-12-01"
 *       404:
 *         description: No se encontró filiación para la historia clínica indicada
 */
/**
 * @swagger
 * /api/hc/filiacion/historia/{id_historia}:
 *   put:
 *     tags:
 *       - Filiación
 *     summary: Actualiza la filiación por historia clínica
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               raza:
 *                 type: string
 *                 example: "Mestizo"
 *               fecha_nacimiento:
 *                 type: string
 *                 example: "1990-01-01"
 *               lugar:
 *                 type: string
 *                 example: "Tacna"
 *               estado_civil:
 *                 type: string
 *                 example: "Soltero"
 *               nombre_conyuge:
 *                 type: string
 *                 example: "N/A"
 *               ocupacion:
 *                 type: string
 *                 example: "Estudiante"
 *               lugar_procedencia:
 *                 type: string
 *                 example: "Tacna"
 *               tiempo_residencia_tacna:
 *                 type: string
 *                 example: "10 años"
 *               direccion:
 *                 type: string
 *                 example: "Av. Ejemplo 123"
 *               ultima_visita_dentista:
 *                 type: string
 *                 example: "2023-01-01"
 *               motivo_visita_dentista:
 *                 type: string
 *                 example: "Control"
 *               ultima_visita_medico:
 *                 type: string
 *                 example: "2023-02-01"
 *               motivo_visita_medico:
 *                 type: string
 *                 example: "Resfrío"
 *               contacto_emergencia:
 *                 type: string
 *                 example: "Madre"
 *               telefono_emergencia:
 *                 type: string
 *                 example: "999888777"
 *               acompaniante:
 *                 type: string
 *                 example: "Hermano"
 *               edad:
 *                 type: integer
 *                 example: 22
 *               sexo:
 *                 type: string
 *                 example: "Masculino"
 *               fecha_elaboracion:
 *                 type: string
 *                 example: "2023-12-01"
 *     responses:
 *       200:
 *         description: Filiación actualizada correctamente
 *       404:
 *         description: No se encontró filiación para la historia clínica indicada
 *       500:
 *         description: Error al actualizar la filiación
 */
