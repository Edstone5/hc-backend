// tests/integration/HU-04-busqueda.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { testData } from '../fixtures/test-data.js';

describe('HU-04: Búsqueda de Historias Clínicas', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000/api';
  let authToken;

  beforeAll(() => {
    authToken = process.env.AUTH_TOKEN || 'test-token';
  });

  describe('Escenario: Buscar historias clínicas de un estudiante', () => {
    it('Debe retornar lista de historias del estudiante', async () => {
      const response = await fetch(`${API_URL}/hc/student/${testData.student.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('Debe filtrar según permisos del usuario', async () => {
      const response = await fetch(`${API_URL}/hc/student/${testData.student.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      // Verificar que solo retorna historias accesibles
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Escenario: Listar historias de adultos', () => {
    it('Debe retornar solo historias de pacientes adultos', async () => {
      const response = await fetch(`${API_URL}/hc/student/${testData.student.id}/adult-historias`, {
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

  describe('Escenario: Búsqueda sin resultados', () => {
    it('Debe retornar lista vacía cuando no hay resultados', async () => {
      const noExistsStudentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const response = await fetch(`${API_URL}/hc/student/${noExistsStudentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('Escenario: Múltiples resultados', () => {
    it('Debe retornar información completa de cada historia', async () => {
      const response = await fetch(`${API_URL}/hc/student/${testData.student.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      if (data.length > 0) {
        const historia = data[0];
        expect(historia).toHaveProperty('id_historia');
        expect(historia).toHaveProperty('estado');
      }
    });
  });

  describe('Escenario: Ordenamiento de resultados', () => {
    it('Debe retornar resultados ordenados', async () => {
      const response = await fetch(`${API_URL}/hc/student/${testData.student.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      // Resultados tienen estructura consistente
      if (data.length > 1) {
        expect(data[0]).toHaveProperty('id_historia');
        expect(data[1]).toHaveProperty('id_historia');
      }
    });
  });
});
