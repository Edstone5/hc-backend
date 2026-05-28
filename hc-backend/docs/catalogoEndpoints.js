/**
 * @swagger
 * /api/catalogo/{nombre}:
 *   get:
 *     tags:
 *       - Catálogo
 *     summary: Obtiene todos los registros de un catálogo permitido
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *           example: catalogo_grupo_sanguineo
 *         description: Nombre del catálogo permitido
 *     responses:
 *       200:
 *         description: Datos del catálogo obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Catalog data retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_grupo_sanguineo:
 *                         type: integer
 *                         example: 1
 *                       nombre:
 *                         type: string
 *                         example: "O+"
 *       404:
 *         description: No se encontraron datos para este catálogo
 *       400:
 *         description: Catálogo no permitido o error de consulta
 *
 * /api/catalogo/{nombre}/{id}:
 *   get:
 *     tags:
 *       - Catálogo
 *     summary: Obtiene el nombre o descripción de un registro de catálogo por id
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *           example: catalogo_grupo_sanguineo
 *         description: Nombre del catálogo permitido
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID del registro en el catálogo
 *     responses:
 *       200:
 *         description: Nombre del registro obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Catalog name retrieved successfully
 *                 id:
 *                   type: string
 *                   example: "1"
 *                 nombre:
 *                   type: string
 *                   example: "O+"
 *       404:
 *         description: No se encontró el registro para este id
 *       400:
 *         description: Catálogo no permitido o error de consulta
 */
