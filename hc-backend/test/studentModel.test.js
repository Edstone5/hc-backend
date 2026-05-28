import { describe, it, expect, vi, afterEach } from 'vitest';
import { StudentModel } from '../models/student/studentModel.js';
import pool from '../db/db.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('StudentModel', () => {
  it('getAdultPatientsByStudentId: éxito', async () => {
    pool.query = vi.fn().mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await StudentModel.getAdultPatientsByStudentId(1);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('getAdultPatientsByStudentId: error', async () => {
    pool.query = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(StudentModel.getAdultPatientsByStudentId(1)).rejects.toThrow(
      'fail'
    );
  });
});
