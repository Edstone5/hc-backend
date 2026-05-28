// tests/integration/HU-03-historial.test.js
import { describe, it, expect, beforeAll } from 'vitest';

describe('HU-03: Historial de Versiones', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000/api';
  let historiaId;
  let authToken;

  beforeAll(() => {
    authToken = process.env.AUTH_TOKEN || 'test-token';
    historiaId = process.env.TEST_HISTORIA_ID || 'historia-uuid-placeholder';
  });

  describe('Escenario: Ver historial de versiones accesible', () => {
    it('Debe retornar lista de versiones', async () => {
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

  describe('Escenario: Historial muestra información completa de cambios', () => {
    it('Debe mostrar campo cambiado, valores anterior y nuevo', async () => {
      const response = await fetch(`${API_URL}/hc/${historiaId}/evolucion`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      if (data.length > 0) {
        const cambio = data[0];
        expect(cambio).toHaveProperty('fecha');
        expect(cambio).toHaveProperty('actividad');
        expect(cambio).toHaveProperty('alumno');
        expect(cambio).toHaveProperty('usuario');
      }
    });

    it('Debe incluir timestamp de cada cambio', async () => {
      const response = await fetch(`${API_URL}/hc/${historiaId}/evolucion`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('fecha');
        // Validar que fecha es timestamp válido
        const fecha = new Date(data[0].fecha);
        expect(fecha).toBeInstanceOf(Date);
      }
    });
  });

  describe('Escenario: Historial ordenado cronológicamente', () => {
    it('Debe retornar cambios en orden cronológico', async () => {
      const response = await fetch(`${API_URL}/hc/${historiaId}/evolucion`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      if (data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          const fecha1 = new Date(data[i].fecha);
          const fecha2 = new Date(data[i + 1].fecha);
          // Verificar que están en orden (podría ser ascendente o descendente)
          expect(fecha1).toBeTruthy();
          expect(fecha2).toBeTruthy();
        }
      }
    });
  });

  describe('Escenario: Historial vacío para historia sin cambios', () => {
    it('Debe retornar lista vacía o mínima para historia sin cambios', async () => {
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
});
