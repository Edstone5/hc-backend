export class HcController {
  constructor(HcModel) {
    this.HcModel = HcModel;
  }

  createReview = async (req, res) => {
    const { idHistory, idTeacher, state, observations } = req.body;
    const result = await this.HcModel.createReview({
      idHistory,
      idTeacher,
      state,
      observations,
    });
    if (result) {
      return res.status(201).json({
        message: 'Revision registrada con exito',
      });
    } else {
      return res.status(500).json({
        error: 'Error al registrar la revision',
      });
    }
  };

  getAllByStudentId = async (req, res) => {
    try {
      const { id } = req.params;
      const historias = await this.HcModel.getAllByStudentId(id);
      res.status(200).json(historias);
    } catch {
      // console.error('Error al obtener historias clínicas:', error);
      res.status(500).json({ error: 'Error al obtener historias clínicas' });
    }
  };

  getFiliationByIdHistory = async (req, res) => {
    const { id } = req.params;
    const filiation = await this.HcModel.getFiliationByIdHistory(id);
    if (!filiation) {
      return res.status(404).json({
        error: 'Filiación no encontrada',
      });
    }
    res.status(200).json(filiation);
  };

  registerHc = async (req, res) => {
    const { idStudent } = req.body;
    const hc = await this.HcModel.registerHc(idStudent);
    if (!hc) {
      return res.status(500).json({
        error: 'Error al registrar la historia clinica',
      });
    }
    res.status(201).json(hc);
  };

  createDraft = async (req, res) => {
    try {
      // El idStudent viene del token JWT (req.user.id)
      const result = await this.HcModel.createDraft(req.user.id);

      return res.status(200).json({
        id_historia: result.id_historia,
      });
    } catch {
      // console.error('Error al crear/obtener borrador:', error);
      return res.status(500).json({
        error: 'Error al crear historia clinica en borrador',
      });
    }
  };

  assignPatient = async (req, res) => {
    try {
      const { idHistory, idPatient } = req.body;

      await this.HcModel.assignPatient(idHistory, idPatient);

      return res.status(200).json({
        message: 'Paciente asignado a la historia clinica',
      });
    } catch (error) {
      // console.error('Error al asignar paciente:', error);
      if (error.message && error.message.includes('no encontrada')) {
        return res.status(400).json({
          error: error.message,
        });
      }
      return res.status(500).json({
        error: 'Error al asignar paciente a la historia',
      });
    }
  };

  getPatientByHistory = async (req, res) => {
    try {
      const { id } = req.params;
      const patient = await this.HcModel.getPatientByHistory(id);

      if (!patient) {
        return res.status(404).json({
          error: 'Paciente no encontrado o historia sin paciente asignado',
        });
      }

      return res.status(200).json(patient);
    } catch {
      // console.error('Error al obtener paciente:', error);
      return res.status(500).json({
        error: 'Error al obtener datos del paciente',
      });
    }
  };

  updateFiliation = async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
      await this.HcModel.updateFiliation({
        idHistory: id,
        ...data,
      });

      res.status(200).json({ message: 'Filiación guardada correctamente' });
    } catch (error) {
      if (error.message && error.message.includes('no encontrado')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error al guardar la filiación' });
    }
  };

  // --- MÉTODOS EXAMEN GENERAL ---
  getGeneralExam = async (req, res) => {
    const { id } = req.params;
    try {
      const exam = await this.HcModel.getGeneralExam(id);
      res.status(200).json(exam || {});
    } catch {
      res.status(500).json({ error: 'Error al obtener el examen general' });
    }
  };

  updateGeneralExam = async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
      await this.HcModel.updateGeneralExam({
        idHistory: id,
        ...data,
      });
      res
        .status(200)
        .json({ message: 'Examen general guardado correctamente' });
    } catch {
      res.status(500).json({ error: 'Error al guardar el examen general' });
    }
  };

  // --- MÉTODOS EXAMEN REGIONAL ---

  getRegionalExam = async (req, res) => {
    const { id } = req.params;
    try {
      const exam = await this.HcModel.getRegionalExam(id);
      res.status(200).json(exam || {});
    } catch {
      res.status(500).json({ error: 'Error al obtener el examen regional' });
    }
  };

  updateRegionalExam = async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
      await this.HcModel.updateRegionalExam({
        idHistory: id,
        ...data,
      });
      res
        .status(200)
        .json({ message: 'Examen regional guardado correctamente' });
    } catch {
      res.status(500).json({ error: 'Error al guardar el examen regional' });
    }
  };

  // --- MÉTODOS EXAMEN BOCA ---

  getExamBoca = async (req, res) => {
    const { id } = req.params;
    try {
      const exam = await this.HcModel.getExamBoca(id);
      res.status(200).json(exam || {});
    } catch {
      res.status(500).json({ error: 'Error al obtener el examen de boca' });
    }
  };

  updateExamBoca = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
      await this.HcModel.updateExamBoca({ idHistory: id, ...data });
      res
        .status(200)
        .json({ message: 'Examen de boca guardado correctamente' });
    } catch {
      res.status(500).json({ error: 'Error al guardar el examen de boca' });
    }
  };

  // --- CONTROLADORES HIGIENE BUCAL ---

  getHigieneOral = async (req, res) => {
    const { id } = req.params;
    try {
      const result = await this.HcModel.getHigieneOral(id);
      // Si no hay datos, devolvemos un objeto vacío para que el frontend no falle
      res.status(200).json(result || {});
    } catch {
      res
        .status(500)
        .json({ error: 'Error al obtener el examen de higiene oral' });
    }
  };

  updateHigieneOral = async (req, res) => {
    const { id } = req.params; // ID de la Historia
    const { estadoHigiene } = req.body;

    // Obtenemos el ID del usuario autenticado desde el middleware
    const idUsuario = req.user.id;

    try {
      await this.HcModel.updateHigieneOral({
        idHistory: id,
        estadoHigiene,
        idUsuario,
      });
      res.status(200).json({ message: 'Higiene bucal guardada correctamente' });
    } catch {
      res.status(500).json({ error: 'Error al guardar la higiene bucal' });
    }
  };

  // --- CONTROLADORES SECCIÓN III (PRESUNTIVO) ---
  getDiagnosticoPresuntivo = async (req, res) => {
    const { id } = req.params;
    try {
      const data = await this.HcModel.getDiagnosticoPresuntivo(id);
      res.status(200).json(data);
    } catch {
      res
        .status(500)
        .json({ error: 'Error al obtener diagnóstico presuntivo' });
    }
  };

  updateDiagnosticoPresuntivo = async (req, res) => {
    const { id } = req.params;
    const { descripcion } = req.body;
    try {
      await this.HcModel.updateDiagnosticoPresuntivo({
        idHistory: id,
        descripcion,
        idUsuario: req.user.id,
      });
      res.status(200).json({ message: 'Diagnóstico presuntivo guardado' });
    } catch {
      res.status(500).json({ error: 'Error al guardar diagnóstico' });
    }
  };

  // --- CONTROLADORES SECCIÓN IV (DERIVACIÓN) ---
  getDerivacion = async (req, res) => {
    const { id } = req.params;
    try {
      const data = await this.HcModel.getDerivacion(id);
      res.status(200).json(data || {});
    } catch {
      res.status(500).json({ error: 'Error al obtener derivaciones' });
    }
  };

  updateDerivacion = async (req, res) => {
    const { id } = req.params;
    const { destinos, observaciones, alumno, docente } = req.body;
    try {
      await this.HcModel.updateDerivacion({
        idHistory: id,
        destinos,
        observaciones,
        alumno,
        docente,
        idUsuario: req.user.id,
      });
      res.status(200).json({ message: 'Derivación guardada correctamente' });
    } catch {
      res.status(500).json({ error: 'Error al guardar derivación' });
    }
  };

  // --- CONTROLADORES SECCIÓN V (CLÍNICAS) ---
  getDiagnosticoClinicas = async (req, res) => {
    const { id } = req.params;
    try {
      const data = await this.HcModel.getDiagnosticoClinicas(id);
      res.status(200).json(data || {});
    } catch {
      res
        .status(500)
        .json({ error: 'Error al obtener diagnóstico de clínicas' });
    }
  };

  updateDiagnosticoClinicas = async (req, res) => {
    const { id } = req.params;
    try {
      await this.HcModel.updateDiagnosticoClinicas({
        idHistory: id,
        data: req.body,
        idUsuario: req.user.id,
      });
      res
        .status(200)
        .json({ message: 'Información clínica guardada correctamente' });
    } catch {
      // console.error(error);
      res.status(500).json({ error: 'Error al guardar información clínica' });
    }
  };

  // --- CONTROLADORES SECCIÓN VI (EVOLUCIÓN) ---

  getEvolucion = async (req, res) => {
    const { id } = req.params;
    try {
      const list = await this.HcModel.getEvolucion(id);
      res.status(200).json(list);
    } catch {
      res.status(500).json({ error: 'Error al obtener evoluciones' });
    }
  };

  addEvolucion = async (req, res) => {
    const { id } = req.params;
    const { fecha, actividad, alumno } = req.body;

    // Validación básica
    if (!fecha || !actividad || !alumno) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }

    try {
      await this.HcModel.addEvolucion({
        idHistory: id,
        fecha,
        actividad,
        alumno,
        idUsuario: req.user.id,
      });
      res.status(201).json({ message: 'Evolución registrada correctamente' });
    } catch {
      res.status(500).json({ error: 'Error al registrar evolución' });
    }
  };
}
