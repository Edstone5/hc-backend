/**
 * @swagger
 * /api/hc/{id}/diagnostico-presuntivo:
 *   get:
 *     tags:
 *       - Diagnóstico Presuntivo
 *     summary: Obtiene el diagnóstico presuntivo por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del diagnóstico presuntivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 descripcion:
 *                   type: string
 *                   example: "Caries dental avanzada"
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Diagnóstico Presuntivo
 *     summary: Actualiza el diagnóstico presuntivo por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
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
 *               descripcion:
 *                 type: string
 *                 example: "Caries dental y pulpitis"
 *     responses:
 *       200:
 *         description: Diagnóstico presuntivo actualizado correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar diagnóstico presuntivo
 *
 * @swagger
 * /api/hc/{id}/derivacion:
 *   get:
 *     tags:
 *       - Derivación
 *     summary: Obtiene la derivación por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos de la derivación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 destinos:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Clínica A", "Clínica B"]
 *                 observaciones:
 *                   type: string
 *                   example: "Paciente requiere atención especializada"
 *                 alumno:
 *                   type: string
 *                   example: "Juan Pérez"
 *                 docente:
 *                   type: string
 *                   example: "Dra. García"
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Derivación
 *     summary: Actualiza la derivación por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
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
 *               destinos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Clínica C"]
 *               observaciones:
 *                 type: string
 *                 example: "Paciente derivado por complicaciones"
 *               alumno:
 *                 type: string
 *                 example: "Ana López"
 *               docente:
 *                 type: string
 *                 example: "Dr. Martínez"
 *     responses:
 *       200:
 *         description: Derivación actualizada correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar derivación
 *
 * @swagger
 * /api/hc/{id}/diagnostico-clinicas:
 *   get:
 *     tags:
 *       - Diagnóstico Clínicas
 *     summary: Obtiene el diagnóstico en clínicas por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del diagnóstico en clínicas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fecha:
 *                   type: string
 *                   format: date
 *                   example: "2025-12-01"
 *                 clinicaRespuesta:
 *                   type: string
 *                   example: "Tratamiento realizado"
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Diagnóstico Clínicas
 *     summary: Actualiza el diagnóstico en clínicas por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
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
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-02"
 *               clinicaRespuesta:
 *                 type: string
 *                 example: "Paciente dado de alta"
 *     responses:
 *       200:
 *         description: Diagnóstico en clínicas actualizado correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar diagnóstico en clínicas
 *
 * @swagger
 * /api/hc/{id}/evolucion:
 *   get:
 *     tags:
 *       - Evolución
 *     summary: Obtiene la lista de evoluciones por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
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
 *                   fecha:
 *                     type: string
 *                     format: date
 *                     example: "2025-12-01"
 *                   actividad:
 *                     type: string
 *                     example: "Control de caries"
 *                   alumno:
 *                     type: string
 *                     example: "Juan Pérez"
 *       404:
 *         description: No encontrado
 *
 *   post:
 *     tags:
 *       - Evolución
 *     summary: Agrega una evolución a la historia clínica
 *     parameters:
 *       - in: path
 *         name: id
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
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-02"
 *               actividad:
 *                 type: string
 *                 example: "Aplicación de flúor"
 *               alumno:
 *                 type: string
 *                 example: "Ana López"
 *     responses:
 *       201:
 *         description: Evolución registrada correctamente
 *       400:
 *         description: Campos requeridos faltantes
 *       500:
 *         description: Error al registrar evolución
 */
