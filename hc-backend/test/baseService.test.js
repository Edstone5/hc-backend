import { describe, it, expect, vi } from 'vitest';
import BaseService from '../services/baseService.js';

describe('BaseService', () => {
  const mockModel = {
    create: vi.fn(async (data) => ({ ...data, id: 1 })),
    getById: vi.fn(async (id) => (id === 1 ? { id } : null)),
    update: vi.fn(async (id, data) => ({ ...data, id })),
    delete: vi.fn(async (id) => id === 1),
  };
  const service = new BaseService(mockModel);

  it('create calls model.create', async () => {
    const result = await service.create({ foo: 'bar' });
    expect(result).toEqual({ foo: 'bar', id: 1 });
    expect(mockModel.create).toHaveBeenCalled();
  });

  it('getById calls model.getById', async () => {
    const result = await service.getById(1);
    expect(result).toEqual({ id: 1 });
    expect(mockModel.getById).toHaveBeenCalled();
  });

  it('update calls model.update', async () => {
    const result = await service.update(1, { foo: 'baz' });
    expect(result).toEqual({ foo: 'baz', id: 1 });
    expect(mockModel.update).toHaveBeenCalled();
  });

  it('delete calls model.delete', async () => {
    const result = await service.delete(1);
    expect(result).toBe(true);
    expect(mockModel.delete).toHaveBeenCalled();
  });
});
