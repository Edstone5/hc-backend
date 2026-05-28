/**
 * @swagger
 * /api/hc/{id}/examen-general:
 *   get:
 *     tags:
 *       - Examen General
 *     summary: Obtiene el examen físico general por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del examen general
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posicion:
 *                   type: string
 *                   example: "Sentado"
 *                 actitud:
 *                   type: string
 *                   example: "Tranquilo"
 *                 deambulacion:
 *                   type: string
 *                   example: "Normal"
 *                 facies:
 *                   type: string
 *                   example: "Normal"
 *                 conciencia:
 *                   type: string
 *                   example: "Lúcido"
 *                 peso:
 *                   type: number
 *                   example: 70
 *                 talla:
 *                   type: number
 *                   example: 170
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Examen General
 *     summary: Actualiza el examen físico general por ID de historia clínica
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
 *               posicion:
 *                 type: string
 *                 example: "De pie"
 *               actitud:
 *                 type: string
 *                 example: "Nervioso"
 *               deambulacion:
 *                 type: string
 *                 example: "Alterada"
 *               facies:
 *                 type: string
 *                 example: "Anormal"
 *               conciencia:
 *                 type: string
 *                 example: "Somnoliento"
 *               peso:
 *                 type: number
 *                 example: 60
 *               talla:
 *                 type: number
 *                 example: 160
 *     responses:
 *       200:
 *         description: Examen general actualizado correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar examen general
 *
 * @swagger
 * /api/hc/{id}/examen-regional:
 *   get:
 *     tags:
 *       - Examen Regional
 *     summary: Obtiene el examen regional por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del examen regional
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cabezaPosicion:
 *                   type: string
 *                   example: "Normal"
 *                 cuelloSimetrico:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Examen Regional
 *     summary: Actualiza el examen regional por ID de historia clínica
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
 *               cabezaPosicion:
 *                 type: string
 *                 example: "Anormal"
 *               cuelloSimetrico:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Examen regional actualizado correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar examen regional
 *
 * @swagger
 * /api/hc/{id}/examen-boca:
 *   get:
 *     tags:
 *       - Examen Clínico de la Boca
 *     summary: Obtiene el examen clínico de la boca por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del examen de boca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 labiosSin:
 *                   type: boolean
 *                   example: true
 *                 labiosCon:
 *                   type: boolean
 *                   example: false
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Examen Clínico de la Boca
 *     summary: Actualiza el examen clínico de la boca por ID de historia clínica
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
 *               labiosSin:
 *                 type: boolean
 *                 example: false
 *               labiosCon:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Examen de boca actualizado correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar examen de boca
 *
 * @swagger
 * /api/hc/{id}/higiene:
 *   get:
 *     tags:
 *       - Higiene Bucal
 *     summary: Obtiene el examen de higiene bucal por ID de historia clínica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del examen de higiene bucal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estadoHigiene:
 *                   type: string
 *                   example: "Bueno"
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Higiene Bucal
 *     summary: Actualiza el examen de higiene bucal por ID de historia clínica
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
 *               estadoHigiene:
 *                 type: string
 *                 example: "Regular"
 *     responses:
 *       200:
 *         description: Higiene bucal actualizada correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar higiene bucal
 */
