/**
 * Swagger docs — Historia Clínica (core): revisión, listado, paciente por HC
 */

/**
 * @swagger
 * /api/hc/review:
 *   post:
 *     tags:
 *       - Historia Clínica
 *     summary: Registra la revisión de una historia clínica (docente)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idHistory, state]
 *             properties:
 *               idHistory:
 *                 type: string
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               idTeacher:
 *                 type: string
 *                 example: "660e8400-e29b-41d4-a716-446655440011"
 *               state:
 *                 type: string
 *                 enum: [aprobado, rechazado, pendiente]
 *                 example: "aprobado"
 *               observations:
 *                 type: string
 *                 example: "Bien estructurado el diagnóstico"
 *     responses:
 *       201:
 *         description: Revisión registrada con éxito
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno
 *
 * /api/hc/{id}/patient:
 *   get:
 *     tags:
 *       - Historia Clínica
 *     summary: Obtiene el paciente asociado a una historia clínica
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del paciente asociado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 nombre:
 *                   type: string
 *                 apellido:
 *                   type: string
 *                 dni:
 *                   type: string
 *       404:
 *         description: No hay paciente asignado a esta historia
 *
 * /api/hc/student/{id}:
 *   get:
 *     tags:
 *       - Historia Clínica
 *     summary: Lista todas las historias clínicas de un estudiante
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID del estudiante
 *     responses:
 *       200:
 *         description: Lista de historias clínicas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_historia:
 *                     type: string
 *                   estado:
 *                     type: string
 *                   paciente:
 *                     type: string
 *
 * /api/hc/student/{id}/adult-historias:
 *   get:
 *     tags:
 *       - Historia Clínica
 *     summary: Lista las historias clínicas de pacientes adultos de un estudiante
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID del estudiante
 *     responses:
 *       200:
 *         description: Lista de historias clínicas adultas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *
 * /api/hc/{id}/derivacion:
 *   get:
 *     tags:
 *       - Derivación Clínicas
 *     summary: Obtiene las derivaciones de una historia clínica
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de derivación
 *   put:
 *     tags:
 *       - Derivación Clínicas
 *     summary: Actualiza las derivaciones de una historia clínica
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               destinos:
 *                 type: array
 *                 items:
 *                   type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Derivación guardada correctamente
 *
 * /api/hc/{id}/diagnostico-clinicas:
 *   get:
 *     tags:
 *       - Diagnóstico Clínicas
 *     summary: Obtiene el diagnóstico de clínicas de una historia
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del diagnóstico clínico
 *   put:
 *     tags:
 *       - Diagnóstico Clínicas
 *     summary: Actualiza el diagnóstico de clínicas de una historia
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               pronostico:
 *                 type: string
 *                 example: "Favorable"
 *               tratamiento:
 *                 type: string
 *               diagnosticoDefinitivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Información clínica guardada correctamente
 *
 * /api/hc/{id}/evolucion:
 *   get:
 *     tags:
 *       - Evolución
 *     summary: Lista las evoluciones de una historia clínica
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de evoluciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   fecha:
 *                     type: string
 *                     format: date
 *                   actividad:
 *                     type: string
 *                   alumno:
 *                     type: string
 *   post:
 *     tags:
 *       - Evolución
 *     summary: Registra una nueva evolución del tratamiento
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-01"
 *               actividad:
 *                 type: string
 *                 example: "Extracción pieza 18"
 *               alumno:
 *                 type: string
 *                 example: "2019-104521"
 *     responses:
 *       201:
 *         description: Evolución registrada correctamente
 *       500:
 *         description: Error interno
 */
