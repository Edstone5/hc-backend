/**
 * @swagger
 * /api/hc/antecedente-medico:
 *   post:
 *     tags:
 *       - Antecedente Médico
 *     summary: Crea un antecedente médico
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
 *               salud_general:
 *                 type: string
 *                 example: "Buena"
 *               bajo_tratamiento:
 *                 type: boolean
 *                 example: false
 *               tipo_tratamiento:
 *                 type: string
 *                 example: "N/A"
 *               hospitalizaciones:
 *                 type: string
 *                 example: "Ninguna"
 *               tuvo_traumatismos:
 *                 type: boolean
 *                 example: false
 *               tipo_traumatismos:
 *                 type: string
 *                 example: "N/A"
 *               alergias:
 *                 type: string
 *                 example: "Ninguna"
 *               medicamentos_contraindicados:
 *                 type: string
 *                 example: "Ninguno"
 *               enf_hepatitis:
 *                 type: boolean
 *                 example: false
 *               enf_alergia_cronica:
 *                 type: boolean
 *                 example: false
 *               enf_corazon:
 *                 type: boolean
 *                 example: false
 *               enf_fiebre_reumatica:
 *                 type: boolean
 *                 example: false
 *               enf_anemia:
 *                 type: boolean
 *                 example: false
 *               enf_asma:
 *                 type: boolean
 *                 example: false
 *               enf_diabetes:
 *                 type: boolean
 *                 example: false
 *               enf_epilepsia:
 *                 type: boolean
 *                 example: false
 *               enf_coagulacion:
 *                 type: boolean
 *                 example: false
 *               enf_tbc:
 *                 type: boolean
 *                 example: false
 *               enf_hipertension:
 *                 type: boolean
 *                 example: false
 *               enf_ulcera:
 *                 type: boolean
 *                 example: false
 *               enf_neurologica:
 *                 type: boolean
 *                 example: false
 *               otras_enf_patologicas:
 *                 type: string
 *                 example: "Ninguna"
 *               odontologicos:
 *                 type: string
 *                 example: "Ninguno"
 *     responses:
 *       201:
 *         description: Antecedente médico creado correctamente
 *       400:
 *         description: Error en los datos enviados
 *
 * @swagger
 * /api/hc/antecedente-medico/historia/{id_historia}:
 *   get:
 *     tags:
 *       - Antecedente Médico
 *     summary: Obtiene el antecedente médico por historia clínica
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del antecedente médico
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_historia:
 *                   type: string
 *                   example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *                 salud_general:
 *                   type: string
 *                   example: "Buena"
 *                 bajo_tratamiento:
 *                   type: boolean
 *                   example: false
 *                 tipo_tratamiento:
 *                   type: string
 *                   example: "N/A"
 *                 hospitalizaciones:
 *                   type: string
 *                   example: "Ninguna"
 *                 tuvo_traumatismos:
 *                   type: boolean
 *                   example: false
 *                 tipo_traumatismos:
 *                   type: string
 *                   example: "N/A"
 *                 alergias:
 *                   type: string
 *                   example: "Ninguna"
 *                 medicamentos_contraindicados:
 *                   type: string
 *                   example: "Ninguno"
 *                 enf_hepatitis:
 *                   type: boolean
 *                   example: false
 *                 enf_alergia_cronica:
 *                   type: boolean
 *                   example: false
 *                 enf_corazon:
 *                   type: boolean
 *                   example: false
 *                 enf_fiebre_reumatica:
 *                   type: boolean
 *                   example: false
 *                 enf_anemia:
 *                   type: boolean
 *                   example: false
 *                 enf_asma:
 *                   type: boolean
 *                   example: false
 *                 enf_diabetes:
 *                   type: boolean
 *                   example: false
 *                 enf_epilepsia:
 *                   type: boolean
 *                   example: false
 *                 enf_coagulacion:
 *                   type: boolean
 *                   example: false
 *                 enf_tbc:
 *                   type: boolean
 *                   example: false
 *                 enf_hipertension:
 *                   type: boolean
 *                   example: false
 *                 enf_ulcera:
 *                   type: boolean
 *                   example: false
 *                 enf_neurologica:
 *                   type: boolean
 *                   example: false
 *                 otras_enf_patologicas:
 *                   type: string
 *                   example: "Ninguna"
 *                 odontologicos:
 *                   type: string
 *                   example: "Ninguno"
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Antecedente Médico
 *     summary: Actualiza el antecedente médico por historia clínica
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
 *               salud_general:
 *                 type: string
 *                 example: "Regular"
 *               bajo_tratamiento:
 *                 type: boolean
 *                 example: true
 *               tipo_tratamiento:
 *                 type: string
 *                 example: "Antibióticos"
 *               hospitalizaciones:
 *                 type: string
 *                 example: "Hospitalización por cirugía"
 *               tuvo_traumatismos:
 *                 type: boolean
 *                 example: true
 *               tipo_traumatismos:
 *                 type: string
 *                 example: "Fractura de brazo"
 *               alergias:
 *                 type: string
 *                 example: "Penicilina"
 *               medicamentos_contraindicados:
 *                 type: string
 *                 example: "Penicilina"
 *               enf_hepatitis:
 *                 type: boolean
 *                 example: false
 *               enf_alergia_cronica:
 *                 type: boolean
 *                 example: true
 *               enf_corazon:
 *                 type: boolean
 *                 example: false
 *               enf_fiebre_reumatica:
 *                 type: boolean
 *                 example: false
 *               enf_anemia:
 *                 type: boolean
 *                 example: false
 *               enf_asma:
 *                 type: boolean
 *                 example: false
 *               enf_diabetes:
 *                 type: boolean
 *                 example: false
 *               enf_epilepsia:
 *                 type: boolean
 *                 example: false
 *               enf_coagulacion:
 *                 type: boolean
 *                 example: false
 *               enf_tbc:
 *                 type: boolean
 *                 example: false
 *               enf_hipertension:
 *                 type: boolean
 *                 example: false
 *               enf_ulcera:
 *                 type: boolean
 *                 example: false
 *               enf_neurologica:
 *                 type: boolean
 *                 example: false
 *               otras_enf_patologicas:
 *                 type: string
 *                 example: "Ninguna"
 *               odontologicos:
 *                 type: string
 *                 example: "Ninguno"
 *     responses:
 *       200:
 *         description: Antecedente médico actualizado correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar antecedente médico
 * */

/**
 * @swagger
 * /api/hc/antecedente-familiar:
 *   post:
 *     tags:
 *       - Antecedente Familiar
 *     summary: Crea un antecedente familiar
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
 *               descripcion:
 *                 type: string
 *                 example: "Padre con hipertensión, madre sana"
 *     responses:
 *       201:
 *         description: Antecedente familiar creado correctamente
 *       400:
 *         description: Error en los datos enviados
 *
 * @swagger
 * /api/hc/antecedente-familiar/historia/{id_historia}:
 *   get:
 *     tags:
 *       - Antecedente Familiar
 *     summary: Obtiene el antecedente familiar por historia clínica
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del antecedente familiar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_historia:
 *                   type: string
 *                   example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *                 descripcion:
 *                   type: string
 *                   example: "Padre con hipertensión, madre sana"
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Antecedente Familiar
 *     summary: Actualiza el antecedente familiar por historia clínica
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
 *               descripcion:
 *                 type: string
 *                 example: "Padre con hipertensión, madre con diabetes"
 *     responses:
 *       200:
 *         description: Antecedente familiar actualizado correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar antecedente familiar
 * */

/**
 * @swagger
 * /api/hc/antecedente-cumplimiento:
 *   post:
 *     tags:
 *       - Antecedente Cumplimiento
 *     summary: Crea un antecedente de cumplimiento
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
 *               motivo_dolor:
 *                 type: string
 *                 example: "Dolor ocasional"
 *               motivo_control:
 *                 type: string
 *                 example: "Control anual"
 *               frecuencia_control_meses:
 *                 type: integer
 *                 example: 12
 *               motivo_limpieza:
 *                 type: string
 *                 example: "Limpieza preventiva"
 *               frecuencia_limpieza_meses:
 *                 type: integer
 *                 example: 6
 *               actitud_tranquilo:
 *                 type: boolean
 *                 example: true
 *               actitud_aprensivo:
 *                 type: boolean
 *                 example: false
 *               actitud_panico:
 *                 type: boolean
 *                 example: false
 *               desagrado_atencion:
 *                 type: boolean
 *                 example: false
 *               fecha_consentimiento:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               firma_nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               historia_elaborada_por:
 *                 type: string
 *                 example: "Dr. García"
 *     responses:
 *       201:
 *         description: Antecedente de cumplimiento creado correctamente
 *       400:
 *         description: Error en los datos enviados
 *
 * @swagger
 * /api/hc/antecedente-cumplimiento/historia/{id_historia}:
 *   get:
 *     tags:
 *       - Antecedente Cumplimiento
 *     summary: Obtiene el antecedente de cumplimiento por historia clínica
 *     parameters:
 *       - in: path
 *         name: id_historia
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la historia clínica
 *     responses:
 *       200:
 *         description: Datos del antecedente de cumplimiento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_historia:
 *                   type: string
 *                   example: "bea73607-a9cc-462f-b14f-bedb4d503e6d"
 *                 motivo_dolor:
 *                   type: string
 *                   example: "Dolor ocasional"
 *                 motivo_control:
 *                   type: string
 *                   example: "Control anual"
 *                 frecuencia_control_meses:
 *                   type: integer
 *                   example: 12
 *                 motivo_limpieza:
 *                   type: string
 *                   example: "Limpieza preventiva"
 *                 frecuencia_limpieza_meses:
 *                   type: integer
 *                   example: 6
 *                 actitud_tranquilo:
 *                   type: boolean
 *                   example: true
 *                 actitud_aprensivo:
 *                   type: boolean
 *                   example: false
 *                 actitud_panico:
 *                   type: boolean
 *                   example: false
 *                 desagrado_atencion:
 *                   type: boolean
 *                   example: false
 *                 fecha_consentimiento:
 *                   type: string
 *                   format: date
 *                   example: "2025-01-01"
 *                 firma_nombre:
 *                   type: string
 *                   example: "Juan Pérez"
 *                 historia_elaborada_por:
 *                   type: string
 *                   example: "Dr. García"
 *       404:
 *         description: No encontrado
 *
 *   put:
 *     tags:
 *       - Antecedente Cumplimiento
 *     summary: Actualiza el antecedente de cumplimiento por historia clínica
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
 *               motivo_dolor:
 *                 type: string
 *                 example: "Dolor frecuente"
 *               motivo_control:
 *                 type: string
 *                 example: "Control semestral"
 *               frecuencia_control_meses:
 *                 type: integer
 *                 example: 6
 *               motivo_limpieza:
 *                 type: string
 *                 example: "Limpieza profunda"
 *               frecuencia_limpieza_meses:
 *                 type: integer
 *                 example: 3
 *               actitud_tranquilo:
 *                 type: boolean
 *                 example: false
 *               actitud_aprensivo:
 *                 type: boolean
 *                 example: true
 *               actitud_panico:
 *                 type: boolean
 *                 example: false
 *               desagrado_atencion:
 *                 type: boolean
 *                 example: true
 *               fecha_consentimiento:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-01"
 *               firma_nombre:
 *                 type: string
 *                 example: "Ana López"
 *               historia_elaborada_por:
 *                 type: string
 *                 example: "Dr. Martínez"
 *     responses:
 *       200:
 *         description: Antecedente de cumplimiento actualizado correctamente
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error al actualizar antecedente de cumplimiento
 * */
