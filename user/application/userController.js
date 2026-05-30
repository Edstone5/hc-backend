/**
 * Adaptador Primario: UserController
 * Construye agregados desde `req`, maneja validaciones y orquesta repositorio.
 */
import argon2 from 'argon2';
import { UserRepository } from '../infrastructure/userRepository.js';
import {
  DomainError,
  UserCodeValueObject,
  EmailValueObject,
  UserAggregate,
  ActualizarEstadoAggregate,
} from '../domain/userDomain.js';

const repo = new UserRepository();

function esErrorDominio(err) {
  return err && (err instanceof DomainError || err.name === 'DomainError');
}

async function construirAgregadoDesdeReq(req) {
  const { userCode, firstName, lastName, dni, email, role, password } =
    req.body;
  const userCodeVO = new UserCodeValueObject(userCode);
  const emailVO = new EmailValueObject(email);
  const hashedPassword = password ? await argon2.hash(password) : null;
  return new UserAggregate({
    userCodeVO,
    firstName,
    lastName,
    dni,
    emailVO,
    role,
    hashedPassword,
  });
}

export const UserController = {
  listarUsuarios: async (req, res) => {
    try {
      const rows = await repo.listarUsuarios();
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: 'Error al listar usuarios' });
    }
  },

  registrarUsuario: async (req, res) => {
    try {
      const agg = await construirAgregadoDesdeReq(req);
      await repo.registrarUsuario(agg);
      return res.status(201).json({
        userCode: agg._userCode.value,
        firstName: agg._firstName,
        lastName: agg._lastName,
      });
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Error registering user' });
    }
  },

  actualizarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      if (typeof activo !== 'boolean') {
        return res.status(400).json({ error: 'activo debe ser true o false' });
      }
      const agg = new ActualizarEstadoAggregate({ id, activo });
      await repo.actualizarEstado(agg);
      return res.status(200).json({
        message: `Usuario ${activo ? 'habilitado' : 'deshabilitado'} correctamente`,
      });
    } catch (err) {
      if (esErrorDominio(err)) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(500)
        .json({ error: 'Error al actualizar estado del usuario' });
    }
  },

  obtenerUsuarioPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await repo.obtenerUsuarioPorId(id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'Usuario no encontrado' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return res.status(500).json({ error: 'Error al obtener usuario' });
    }
  },
};
