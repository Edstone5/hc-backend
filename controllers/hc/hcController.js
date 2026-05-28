export class HcController {
  constructor(hcModel) {
    this.hcModel = hcModel;
  }

  async createReview(req, res) {
    try {
      const ok = await this.hcModel.createReview(req.body);
      if (ok) {
        return res.status(201).json({ message: 'Revisión creada' });
      }
      return res.status(500).json({ error: 'Error al crear revisión' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getAllByStudentId(req, res) {
    try {
      const rows = await this.hcModel.getAllByStudentId(req.params.id);
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getFiliationByIdHistory(req, res) {
    try {
      const result = await this.hcModel.getFiliationByIdHistory(req.params.id);
      if (!result) {
        return res.status(404).json({});
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async registerHc(req, res) {
    try {
      const result = await this.hcModel.registerHc(req.body.idStudent);
      if (!result) {
        return res.status(500).json({});
      }
      return res.status(201).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async createDraft(req, res) {
    try {
      const result = await this.hcModel.createDraft(req.body.idStudent);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async assignPatient(req, res) {
    try {
      await this.hcModel.assignPatient(req.body.idHistory, req.body.idPatient);
      return res.status(200).json({});
    } catch (err) {
      if (err && err.message && err.message.includes('no encontrada')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  async getPatientByHistory(req, res) {
    try {
      const result = await this.hcModel.getPatientByHistory(req.params.id);
      if (!result) {
        return res.status(404).json({});
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateFiliation(req, res) {
    try {
      await this.hcModel.updateFiliation({
        idHistory: req.params.id,
        ...req.body,
      });
      return res.status(200).json({});
    } catch (err) {
      if (err && err.message && err.message.includes('no encontrado')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  async getGeneralExam(req, res) {
    try {
      const result = await this.hcModel.getGeneralExam(req.params.id);
      if (!result) {
        return res.status(404).json({});
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateGeneralExam(req, res) {
    try {
      await this.hcModel.updateGeneralExam({
        idHistory: req.params.id,
        ...req.body,
      });
      return res.status(200).json({});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getRegionalExam(req, res) {
    try {
      const result = await this.hcModel.getRegionalExam(req.params.id);
      if (!result) {
        return res.status(404).json({});
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateRegionalExam(req, res) {
    try {
      await this.hcModel.updateRegionalExam({
        idHistory: req.params.id,
        ...req.body,
      });
      return res.status(200).json({});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getExamBoca(req, res) {
    try {
      const result = await this.hcModel.getExamBoca(req.params.id);
      if (!result) {
        return res.status(404).json({});
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateExamBoca(req, res) {
    try {
      await this.hcModel.updateExamBoca({
        idHistory: req.params.id,
        ...req.body,
      });
      return res.status(200).json({});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getHigieneOral(req, res) {
    try {
      const result = await this.hcModel.getHigieneOral(req.params.id);
      if (!result) {
        return res.status(404).json({});
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateHigieneOral(req, res) {
    try {
      await this.hcModel.updateHigieneOral({
        idHistory: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });
      return res.status(200).json({});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getDiagnosticoPresuntivo(req, res) {
    try {
      const result = await this.hcModel.getDiagnosticoPresuntivo(req.params.id);
      if (!result) {
        return res.status(404).json({});
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateDiagnosticoPresuntivo(req, res) {
    try {
      await this.hcModel.updateDiagnosticoPresuntivo({
        idHistory: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });
      return res.status(200).json({});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getDerivacion(req, res) {
    try {
      const result = await this.hcModel.getDerivacion(req.params.id);
      if (!result) {
        return res.status(404).json({});
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateDerivacion(req, res) {
    try {
      await this.hcModel.updateDerivacion({
        idHistory: req.params.id,
        ...req.body,
        idUsuario: req.user?.id,
      });
      return res.status(200).json({});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getDiagnosticoClinicas(req, res) {
    try {
      const result = await this.hcModel.getDiagnosticoClinicas(req.params.id);
      if (!result) {
        return res.status(404).json({});
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateDiagnosticoClinicas(req, res) {
    try {
      await this.hcModel.updateDiagnosticoClinicas({
        idHistory: req.params.id,
        data: req.body,
        idUsuario: req.user?.id,
      });
      return res.status(200).json({});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getEvolucion(req, res) {
    try {
      const rows = await this.hcModel.getEvolucion(req.params.id);
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async addEvolucion(req, res) {
    try {
      const { fecha, actividad, alumno } = req.body;
      if (!fecha || !actividad || !alumno) {
        return res.status(400).json({ error: 'Faltan campos' });
      }
      await this.hcModel.addEvolucion({
        idHistory: req.params.id,
        fecha,
        actividad,
        alumno,
        idUsuario: req.user?.id,
      });
      return res.status(201).json({});
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default HcController;
