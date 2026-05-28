// tests/integration/HU-02-filiacion.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { testData } from '../fixtures/test-data.js';

describe('HU-02: Registro de Filiación', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000/api';
  let historiaId;
  let authToken;

  beforeAll(async () => {
    authToken = process.env.AUTH_TOKEN || 'test-token';
    // En escenario real, se crearía una historia primero
    historiaId = process.env.TEST_HISTORIA_ID || 'historia-uuid-placeholder';
  });

  describe('Escenario: Registrar datos de filiación correctamente', () => {
    it('Debe crear filiación con datos válidos', async () => {
      const response = await fetch(`${API_URL}/hc/filiacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(testData.filiacion)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('éxito');
    });

    it('Debe guardar la información correctamente', async () => {
      const response = await fetch(`${API_URL}/hc/filiacion/historia/${historiaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('data');
    });
  });

  describe('Escenario: Actualizar datos de filiación existentes', () => {
    it('Debe actualizar filiación existente', async () => {
      const updatedData = {
        ...testData.filiacion,
        edad: 36,
        ocupacion: 'Ingeniero Senior'
      };

      const response = await fetch(`${API_URL}/hc/filiacion/historia/${historiaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('message');
    });

    it('Debe registrar cambio en historial de versiones', async () => {
      const response = await fetch(`${API_URL}/hc/${historiaId}/evolucion`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Escenario: Rechazar datos inválidos en filiación', () => {
    it('Debe rechazar edad inválida', async () => {
      const invalidData = {
        ...testData.filiacion,
        edad: 'abc'
      };

      const response = await fetch(`${API_URL}/hc/filiacion/historia/${historiaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(invalidData)
      });

      expect([400, 500]).toContain(response.status);
    });
  });
});
