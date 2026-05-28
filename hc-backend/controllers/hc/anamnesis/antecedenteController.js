import {
  AntecedentePersonal,
  AntecedenteMedico,
  AntecedenteFamiliar,
  AntecedenteCumplimiento,
} from '../../../models/hc/anamnesis/antecedenteModel.js';
// --- Antecedente Cumplimiento ---
export const createAntecedenteCumplimiento = async (req, res) => {
  try {
    const ok = await AntecedenteCumplimiento.create(req.body);
    if (ok) {
      return res.status(201).json({
        message: 'Antecedente de cumplimiento registrado correctamente',
      });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo registrar el antecedente de cumplimiento' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAntecedenteCumplimiento = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const result = await AntecedenteCumplimiento.getByHistoria(id_historia);
    if (!result) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAntecedenteCumplimiento = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const ok = await AntecedenteCumplimiento.update(id_historia, req.body);
    if (ok) {
      return res.status(200).json({
        message: 'Antecedente de cumplimiento actualizado correctamente',
      });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar el antecedente de cumplimiento' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// --- Antecedente Familiar ---
export const createAntecedenteFamiliar = async (req, res) => {
  try {
    const ok = await AntecedenteFamiliar.create(req.body);
    if (ok) {
      return res
        .status(201)
        .json({ message: 'Antecedente familiar registrado correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo registrar el antecedente familiar' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAntecedenteFamiliar = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const result = await AntecedenteFamiliar.getByHistoria(id_historia);
    if (!result) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAntecedenteFamiliar = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const ok = await AntecedenteFamiliar.update(id_historia, req.body);
    if (ok) {
      return res
        .status(200)
        .json({ message: 'Antecedente familiar actualizado correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar el antecedente familiar' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Antecedente Personal ---
export const createAntecedentePersonal = async (req, res) => {
  try {
    const ok = await AntecedentePersonal.create(req.body);
    if (ok) {
      return res
        .status(201)
        .json({ message: 'Antecedente personal registrado correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo registrar el antecedente personal' });
  } catch (err) {
    // console.error('Error en createAntecedentePersonal:', err);
    return res.status(400).json({
      error: err.message || 'Error al registrar el antecedente personal',
    });
  }
};

export const getAntecedentePersonal = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const result = await AntecedentePersonal.getByHistoria(id_historia);
    if (!result) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAntecedentePersonal = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const ok = await AntecedentePersonal.update(id_historia, req.body);
    if (ok) {
      return res
        .status(200)
        .json({ message: 'Antecedente personal actualizado correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar el antecedente personal' });
  } catch (err) {
    // console.error('Error en updateAntecedentePersonal:', err);
    return res.status(400).json({
      error: err.message || 'Error al actualizar el antecedente personal',
    });
  }
};

// --- Antecedente Médico ---
export const createAntecedenteMedico = async (req, res) => {
  try {
    const ok = await AntecedenteMedico.create(req.body);
    if (ok) {
      return res
        .status(201)
        .json({ message: 'Antecedente médico registrado correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo registrar el antecedente médico' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAntecedenteMedico = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const result = await AntecedenteMedico.getByHistoria(id_historia);
    if (!result) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAntecedenteMedico = async (req, res) => {
  try {
    const { id_historia } = req.params;
    const ok = await AntecedenteMedico.update(id_historia, req.body);
    if (ok) {
      return res
        .status(200)
        .json({ message: 'Antecedente médico actualizado correctamente' });
    }
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar el antecedente médico' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
