export class PatientController {
  constructor(patientModel) {
    this.patientModel = patientModel;
  }

  async createPatient(req, res) {
    try {
      const { nombre, apellido } = req.body || {};
      if (!nombre || !apellido) {
        return res.status(400).json({ error: 'Falta nombre o apellido' });
      }
      try {
        const result = await this.patientModel.createPatient(
          nombre,
          apellido,
          req.body.dni,
          req.body.fecha,
          req.body.sexo,
          req.body.telefono,
          req.body.email
        );
        return res.status(201).json(result);
      } catch (err) {
        if (err && err.message && err.message.includes('Ya existe')) {
          return res
            .status(409)
            .json({ error: 'Ya existe un paciente con ese DNI' });
        }
        return res.status(500).json({ error: 'Error al crear paciente.' });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Error al crear paciente.' });
    }
  }

  async updatePatient(req, res) {
    try {
      const id = req.params.id;
      if (!id || id.length < 36) {
        return res.status(400).json({ error: 'Id inválido' });
      }
      try {
        await this.patientModel.updatePatient(
          id,
          req.body.nombre,
          req.body.apellido,
          req.body.telefono,
          req.body.email
        );
        return res
          .status(200)
          .json({ message: 'Datos del paciente actualizados' });
      } catch (err) {
        if (err && err.message && err.message.includes('No existe')) {
          return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        return res
          .status(500)
          .json({ error: 'Error interno al actualizar el paciente.' });
      }
    } catch (err) {
      return res
        .status(500)
        .json({ error: 'Error interno al actualizar el paciente.' });
    }
  }
}
