/**
 * @swagger
 * /api/hc/student/{id}:
 *   get:
 *     tags:
 *       - Historias Clínicas por Estudiante
 *     summary: Obtiene todas las historias clínicas de un estudiante
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
 *                     example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *                   paciente:
 *                     type: string
 *                     example: "Juan Pérez"
 *                   fecha:
 *                     type: string
 *                     format: date
 *                     example: "2025-12-01"
 *       404:
 *         description: No encontrado
 *
 * /api/hc/student/{id}/adult-historias:
 *   get:
 *     tags:
 *       - Historias Clínicas Adultas por Estudiante
 *     summary: Obtiene las historias clínicas adultas de un estudiante específico
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
 *                 properties:
 *                   id_historia:
 *                     type: string
 *                     example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *                   paciente:
 *                     type: string
 *                     example: "Ana García"
 *                   fecha:
 *                     type: string
 *                     format: date
 *                     example: "2025-12-01"
 *       404:
 *         description: No encontrado
 */
