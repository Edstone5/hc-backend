import { getAdultHistoriasByStudent } from '../../../models/hc/hcModels/listaHcAdultos.js';

export const listaHcAdultos = async (req, res) => {
  try {
    const result = await getAdultHistoriasByStudent(req.params.id);
    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({ error: 'No se encontraron historias clínicas adultas.' });
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export default { listaHcAdultos };
