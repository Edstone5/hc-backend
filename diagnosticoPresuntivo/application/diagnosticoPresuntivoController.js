import {
  DomainError,
  DiagnosticoPresuntivoAggregate,
} from '../domain/diagnosticoPresuntivoDomain.js';
import { DiagnosticoPresuntivoRepository } from '../infrastructure/diagnosticoPresuntivoRepository.js';

const repo = new DiagnosticoPresuntivoRepository();

const esErrorDominio = (err) =>
  err && (err instanceof DomainError || err.name === 'DomainError');

const stripHCPrefix = (id) => {
  if (!id) {
    return id;
  }
  return id.startsWith('HC-') ? id.slice(3) : id;
};

const construirIdHistoria = (req) => {
  const id = req.params.id_historia || req.params.id;
  if (!id) {
    throw new DomainError('id_historia es requerido');
  }
  return stripHCPrefix(String(id));
};

const construirAgregado = (req) => {
  const idHistory = req.params.id_historia || req.params.id;
  const { descripcion } = req.body;
  return new DiagnosticoPresuntivoAggregate({
    idHistory,
    descripcion,
    idUsuario: req.user && req.user.id,
  });
};

export const DiagnosticoPresuntivoController = {
  consultarDiagnosticoPresuntivo: async (req, res) => {
    try {
      const id = construirIdHistoria(req);
      const result = await repo.consultarPorHistoria(id);
      res.status(200).json(result || {});
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  },

  actualizarDiagnosticoPresuntivo: async (req, res) => {
    try {
      const agregado = construirAgregado(req);
      await repo.actualizarDiagnosticoPresuntivo(agregado);
      res.status(200).json({ message: 'Diagnóstico presuntivo guardado' });
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  },
};
