// tests/integration/HU-01-registro-historia.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testData } from '../fixtures/test-data.js';

describe('HU-01: Registro de Historia Clínica', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000/api';
  let historiaId;
  let authToken;

  beforeAll(async () => {
    // En un entorno real, aquí obtendríamos el token de autenticación
    authToken = process.env.AUTH_TOKEN || 'test-token';
  });

  describe('Escenario: Registrar una historia clínica correctamente', () => {
    it('Debe crear una historia clínica con idStudent válido', async () => {
      const response = await fetch(`${API_URL}/hc/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          idStudent: testData.student.id
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id_historia');
      expect(data).toHaveProperty('id_estudiante');
      historiaId = data.id_historia;
    });

    it('Debe generar un identificador único (UUID)', () => {
      expect(historiaId).toBeTruthy();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(historiaId).toMatch(uuidRegex);
    });

    it('Debe retornar la historia clínica registrada', async () => {
      const response = await fetch(`${API_URL}/hc/student/${testData.student.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.some(h => h.id_historia === historiaId)).toBe(true);
    });
  });

  describe('Escenario: Registrar historia clínica sin datos obligatorios', () => {
    it('Debe rechazar registro sin idStudent', async () => {
      const response = await fetch(`${API_URL}/hc/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  afterAll(async () => {
    // Cleanup si es necesario
  });
});
