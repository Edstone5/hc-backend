export class StudentController {
  constructor(studentModel) {
    this.studentModel = studentModel;
  }

  async getAdultPatientsByStudentId(req, res) {
    try {
      const id = req.params.id;
      if (!id || id.length !== 36) {
        return res.status(400).json({ error: 'UUID inválido' });
      }
      const rows = await this.studentModel.getAdultPatientsByStudentId(id);
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async registerPatient(req, res) {
    try {
      const studentId = req.params.studentId;
      if (!studentId || studentId.length !== 36) {
        return res.status(400).json({ error: 'UUID inválido' });
      }
      if (!req.body.nombreCompleto) {
        return res.status(400).json({ error: 'Falta nombre completo' });
      }
      const newPatient = await this.studentModel.registerPatient(
        studentId,
        req.body
      );
      return res.status(201).json(newPatient);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default StudentController;
