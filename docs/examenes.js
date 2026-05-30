/**
 * Swagger docs — Exámenes físicos, bucal e higiene oral
 * Rutas alternativas con prefijo /historia/:id_historia
 */

/**
 * @swagger
 * /api/hc/examen-general:
 *   post:
 *     tags:
 *       - Examen General
 *     summary: Registra el examen físico general
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_historia]
 *             properties:
 *               id_historia:
 *                 type: string
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               posicion:
 *                 type: string
 *                 example: "Sentado"
 *               actitud:
 *                 type: string
 *                 example: "Tranquilo"
 *               facies:
 *                 type: string
 *                 example: "Normal"
 *               peso:
 *                 type: number
 *                 example: 70
 *               talla:
 *                 type: number
 *                 example: 170
 *     responses:
 *       201:
 *         description: Examen registrado correctamente
 *       400:
 *         description: Error de validación de dominio
 *       500:
 *         description: Error interno del servidor
 *
 * /api/hc/examen-general/historia/{id_historia}:
 *   get:
 *     tags:
 *       - Examen General
 *     summary: Obtiene el examen físico general por historia clínica
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID v4 de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del examen general
 *       400:
 *         description: UUID inválido
 *   put:
 *     tags:
 *       - Examen General
 *     summary: Actualiza el examen físico general por historia clínica
 *     security:
 *       - cookieAuth: []
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
 *               posicion:
 *                 type: string
 *               peso:
 *                 type: number
 *               talla:
 *                 type: number
 *     responses:
 *       200:
 *         description: Actualizado correctamente
 *       400:
 *         description: Error de validación
 *
 * /api/hc/examen-regional:
 *   post:
 *     tags:
 *       - Examen Regional
 *     summary: Registra el examen físico regional
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_historia]
 *             properties:
 *               id_historia:
 *                 type: string
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               cabeza:
 *                 type: string
 *                 example: "Normal"
 *               cuello:
 *                 type: string
 *                 example: "Normal"
 *     responses:
 *       201:
 *         description: Examen regional registrado
 *       400:
 *         description: Error de validación
 *
 * /api/hc/examen-regional/historia/{id_historia}:
 *   get:
 *     tags:
 *       - Examen Regional
 *     summary: Obtiene el examen físico regional
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del examen regional
 *   put:
 *     tags:
 *       - Examen Regional
 *     summary: Actualiza el examen físico regional
 *     security:
 *       - cookieAuth: []
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
 *               cabeza:
 *                 type: string
 *               cuello:
 *                 type: string
 *     responses:
 *       200:
 *         description: Actualizado correctamente
 *
 * /api/hc/{id}/examen-boca:
 *   get:
 *     tags:
 *       - Examen Clínico Bucal
 *     summary: Obtiene el examen clínico de la boca
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID v4 de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del examen bucal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 labios:
 *                   type: string
 *                   example: "Normal"
 *                 carrillos:
 *                   type: string
 *                   example: "Normal"
 *                 paladar:
 *                   type: string
 *                   example: "Normal"
 *       400:
 *         description: UUID inválido
 *   put:
 *     tags:
 *       - Examen Clínico Bucal
 *     summary: Actualiza el examen clínico de la boca
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
 *               labios:
 *                 type: string
 *               carrillos:
 *                 type: string
 *               paladar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Examen bucal guardado correctamente
 *
 * /api/hc/{id}/higiene:
 *   get:
 *     tags:
 *       - Higiene Bucal (IHOS)
 *     summary: Obtiene el examen de higiene oral
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID v4 de la historia clínica
 *     responses:
 *       200:
 *         description: Datos de higiene oral
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estadoHigiene:
 *                   type: string
 *                   example: "Bueno"
 *                 ihos:
 *                   type: number
 *                   example: 0.5
 *   put:
 *     tags:
 *       - Higiene Bucal (IHOS)
 *     summary: Actualiza el examen de higiene oral
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
 *             required: [estadoHigiene]
 *             properties:
 *               estadoHigiene:
 *                 type: string
 *                 example: "Regular"
 *               ihos:
 *                 type: number
 *                 example: 1.2
 *     responses:
 *       200:
 *         description: Higiene bucal guardada correctamente
 */
