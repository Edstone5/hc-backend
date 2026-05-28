import { describe, it, expect, vi, afterEach } from 'vitest';
import argon2 from 'argon2';
import { UserModel } from '../models/user/userModel.js';
import pool from '../db/db.js';

const originalQuery = pool.query;
const originalHash = argon2.hash;
const originalVerify = argon2.verify;

afterEach(() => {
  pool.query = originalQuery;
  argon2.hash = originalHash;
  argon2.verify = originalVerify;
});

describe('UserModel', () => {
  it('register: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({});
    argon2.hash = vi.fn().mockResolvedValue('hashed');
    const result = await UserModel.register(
      'u1',
      'Juan',
      'Perez',
      '12345678',
      'juan@mail.com',
      'admin',
      'pass'
    );
    expect(result).toEqual({
      userCode: 'u1',
      firstName: 'Juan',
      lastName: 'Perez',
      dni: '12345678',
      email: 'juan@mail.com',
      role: 'admin',
    });
  });

  it('register: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    argon2.hash = vi.fn().mockResolvedValue('hashed');
    const result = await UserModel.register(
      'u1',
      'Juan',
      'Perez',
      '12345678',
      'juan@mail.com',
      'admin',
      'pass'
    );
    expect(result).toBeNull();
  });

  it('getUserById: con resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id_usuario: 1 }] });
    const result = await UserModel.getUserById(1);
    expect(result).toEqual({ id_usuario: 1 });
  });

  it('getUserById: sin resultado', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await UserModel.getUserById(1);
    expect(result).toBeNull();
  });

  it('login: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({
      rows: [
        {
          id_usuario: 1,
          contrasena_hash: 'hashed',
          nombre: 'Juan',
          apellido: 'Perez',
          dni: '12345678',
          email: 'juan@mail.com',
          rol: 'admin',
        },
      ],
    });
    argon2.verify = vi.fn().mockResolvedValue(true);
    const result = await UserModel.login('u1', 'pass');
    expect(result).toEqual({
      id: 1,
      userCode: 'u1',
      firstName: 'Juan',
      lastName: 'Perez',
      dni: '12345678',
      email: 'juan@mail.com',
      role: 'admin',
    });
  });

  it('login: usuario no existe', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [] });
    const result = await UserModel.login('u1', 'pass');
    expect(result).toBeNull();
  });

  it('login: contraseña incorrecta', async () => {
    pool.query = vi.fn().mockResolvedValue({
      rows: [
        {
          id_usuario: 1,
          contrasena_hash: 'hashed',
          nombre: 'Juan',
          apellido: 'Perez',
          dni: '12345678',
          email: 'juan@mail.com',
          rol: 'admin',
        },
      ],
    });
    argon2.verify = vi.fn().mockResolvedValue(false);
    const result = await UserModel.login('u1', 'wrongpass');
    expect(result).toBeNull();
  });
});
