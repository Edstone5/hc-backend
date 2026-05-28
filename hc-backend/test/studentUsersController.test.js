import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db/db.js', () => ({
  default: {
    query: vi.fn(),
  },
}));

import * as controller from '../controllers/users/studentUsersController.js';
import pool from '../db/db.js';

describe('studentUsersController', () => {
  let req, res;
  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    pool.query.mockClear();
  });

  it('should return 200 and students', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
    await controller.getAllStudentUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('should return 500 on error', async () => {
    pool.query.mockRejectedValue(new Error('fail'));
    await controller.getAllStudentUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al obtener estudiantes',
    });
  });
});
