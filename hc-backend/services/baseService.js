// BaseService: Servicio genérico para operaciones CRUD
// Recibe un modelo con métodos SQL y expone métodos reutilizables

class BaseService {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async getById(id) {
    return await this.model.getById(id);
  }

  async update(id, data) {
    return await this.model.update(id, data);
  }

  async delete(id) {
    return await this.model.delete(id);
  }
}

export default BaseService;
