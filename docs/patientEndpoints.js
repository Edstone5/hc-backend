/**
 * Swagger docs — Pacientes
 */

/**
 * @swagger
 * /api/patients:
 *   post:
 *     tags:
 *       - Pacientes
 *     summary: Registra un nuevo paciente
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, dni, fechaNacimiento]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "María"
 *               apellido:
 *                 type: string
 *                 example: "Flores Ticona"
 *               dni:
 *                 type: string
 *                 example: "70123456"
 *               fechaNacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1985-03-15"
 *               sexo:
 *                 type: string
 *                 example: "Femenino"
 *               telefono:
 *                 type: string
 *                 example: "987654321"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "maria@ejemplo.com"
 *     responses:
 *       201:
 *         description: Paciente creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Error de validación (nombre vacío, apellido vacío, fecha inválida)
 *       409:
 *         description: Ya existe un paciente con ese DNI
 *       500:
 *         description: Error interno del servidor
 *
 * /api/patients/{id}:
 *   put:
 *     tags:
 *       - Pacientes
 *     summary: Actualiza los datos de un paciente
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID v4 del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "María"
 *               apellido:
 *                 type: string
 *                 example: "Flores Ticona"
 *               telefono:
 *                 type: string
 *                 example: "987654321"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "maria@ejemplo.com"
 *     responses:
 *       200:
 *         description: Datos actualizados correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Datos del paciente actualizados correctamente"
 *       400:
 *         description: UUID de paciente inválido
 *       404:
 *         description: Paciente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
