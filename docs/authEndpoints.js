/**
 * Swagger docs — Autenticación y Usuarios
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registra un nuevo usuario en el sistema
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userCode, firstName, lastName, dni, email, role, password]
 *             properties:
 *               userCode:
 *                 type: string
 *                 example: "2019-104521"
 *               firstName:
 *                 type: string
 *                 example: "Juan"
 *               lastName:
 *                 type: string
 *                 example: "Quispe Mamani"
 *               dni:
 *                 type: string
 *                 example: "74123456"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.quispe@unjbg.edu.pe"
 *               role:
 *                 type: string
 *                 enum: [alumno, docente, admin]
 *                 example: "alumno"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Secret123!"
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userCode:
 *                   type: string
 *                   example: "2019-104521"
 *                 firstName:
 *                   type: string
 *                   example: "Juan"
 *                 lastName:
 *                   type: string
 *                   example: "Quispe Mamani"
 *       400:
 *         description: Error de validación (userCode inválido, email inválido, etc.)
 *       500:
 *         description: Error interno del servidor
 *
 * /api/users/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Inicia sesión y establece cookie de autenticación
 *     security: []
 *     description: >
 *       Autentica al usuario con userCode + password (Argon2).
 *       Si las credenciales son válidas, devuelve los datos del usuario
 *       y establece las cookies `accessToken` y `refreshToken` (HttpOnly).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userCode, password]
 *             properties:
 *               userCode:
 *                 type: string
 *                 example: "2019-104521"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Secret123!"
 *     responses:
 *       200:
 *         description: Login exitoso — cookie `accessToken` establecida
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "accessToken=eyJ...; HttpOnly; SameSite=Strict"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "1"
 *                 userCode:
 *                   type: string
 *                   example: "2019-104521"
 *                 firstName:
 *                   type: string
 *                   example: "Juan"
 *                 lastName:
 *                   type: string
 *                   example: "Quispe Mamani"
 *                 email:
 *                   type: string
 *                   example: "juan.quispe@unjbg.edu.pe"
 *                 role:
 *                   type: string
 *                   example: "alumno"
 *       400:
 *         description: userCode o password vacíos
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error interno del servidor
 *
 * /api/users/logout:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Cierra la sesión del usuario actual
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso — cookie `accessToken` eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout exitoso"
 *
 * /api/users/me:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Devuelve los datos del usuario autenticado actualmente
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userCode:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: No autenticado
 *
 * /api/users:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Lista todos los usuarios (solo admin)
 *     security:
 *       - cookieAuth: []
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
 *                   role:
 *                     type: string
 *       500:
 *         description: Error interno
 *
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Obtiene un usuario por ID
 *     security:
 *       - cookieAuth: []
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       404:
 *         description: Usuario no encontrado
 */
