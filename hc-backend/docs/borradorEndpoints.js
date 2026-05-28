/**
 * @swagger
 * /api/hc/draft:
 *   post:
 *     tags:
 *       - Borrador Historia Clínica
 *     summary: Crea u obtiene un borrador de historia clínica para el estudiante autenticado
 *     responses:
 *       200:
 *         description: Borrador creado u obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_historia:
 *                   type: string
 *                   example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *       500:
 *         description: Error al crear historia clínica en borrador
 *
 * /api/hc/assign-patient:
 *   patch:
 *     tags:
 *       - Asignación de Paciente
 *     summary: Asigna un paciente a una historia clínica en borrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idHistory:
 *                 type: string
 *                 example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *               idPatient:
 *                 type: string
 *                 example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
 *     responses:
 *       200:
 *         description: Paciente asignado correctamente
 *       400:
 *         description: Error de validación o historia no encontrada
 *       500:
 *         description: Error al asignar paciente
 *
 * /api/hc/register:
 *   post:
 *     tags:
 *       - Registro Historia Clínica
 *     summary: Registra una nueva historia clínica para un estudiante
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idStudent:
 *                 type: string
 *                 example: "e1a2b3c4-d5f6-7890-abcd-1234567890ab"
 *     responses:
 *       201:
 *         description: Historia clínica registrada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_historia:
 *                   type: string
 *                   example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *       500:
 *         description: Error al registrar la historia clínica
 */
