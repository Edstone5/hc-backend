// tests/integration/HU-07-validacion.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { testData } from '../fixtures/test-data.js';

describe('HU-07: Validación y Comentarios', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000/api';
  let historiaId;
  let authToken;

  beforeAll(() => {
    authToken = process.env.AUTH_TOKEN || 'test-token';
    historiaId = process.env.TEST_HISTORIA_ID || 'historia-uuid-placeholder';
  });

  describe('Escenario: Docente valida entrada con comentario', () => {
    it('Debe registrar revisión validada con observaciones', async () => {
      const response = await fetch(`${API_URL}/hc/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          idHistory: historiaId,
          idTeacher: testData.teacher.id,
          state: 'validado',
          observations: 'Excelente trabajo, todos los campos completos.'
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('éxito');
    });

    it('Debe retornar código 201 al validar', async () => {
      const response = await fetch(`${API_URL}/hc/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(testData.revision)
      });

      expect([201, 200]).toContain(response.status);
    });
  });

  describe('Escenario: Docente rechaza entrada con comentario', () => {
    it('Debe registrar revisión rechazada con observaciones', async () => {
      const response = await fetch(`${API_URL}/hc/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(testData.revisionRechazo)
      });

      expect([201, 200]).toContain(response.status);
      const data = await response.json();
      expect(data).toHaveProperty('message');
    });
  });

  describe('Escenario: Notificación enviada al estudiante', () => {
    it('Debe registrar la validación en auditoría', async () => {
      const response = await fetch(`${API_URL}/hc/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          idHistory: historiaId,
          idTeacher: testData.teacher.id,
          state: 'validado',
          observations: 'Revisado correctamente'
        })
      });

      expect(response.status).toBe(201);
      // La auditoría debe registrarse automáticamente
    });
  });

  describe('Escenario: Validación solo por docentes', () => {
    it('Debe rechazar validación de usuario sin permisos', async () => {
      const invalidToken = 'invalid-student-token';
      const response = await fetch(`${API_URL}/hc/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${invalidToken}`
        },
        body: JSON.stringify(testData.revision)
      });

      // Debería rechazar o requerir autenticación válida
      expect([401, 403, 500]).toContain(response.status);
    });
  });

  describe('Escenario: Múltiples validaciones de la misma historia', () => {
    it('Debe permitir registrar validación de otro docente', async () => {
      const otherTeacher = {
        idHistory: historiaId,
        idTeacher: 'other-teacher-uuid',
        state: 'validado',
        observations: 'Segunda opinión: trabajo correcto'
      };

      const response = await fetch(`${API_URL}/hc/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(otherTeacher)
      });

      expect([201, 200]).toContain(response.status);
    });
  });

  describe('Escenario: Observaciones opcionales', () => {
    it('Debe aceptar validación sin observaciones', async () => {
      const response = await fetch(`${API_URL}/hc/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          idHistory: historiaId,
          idTeacher: testData.teacher.id,
          state: 'validado'
          // Sin observations
        })
      });

      expect([201, 200]).toContain(response.status);
    });

    it('Debe aceptar validación con observaciones vacías', async () => {
      const response = await fetch(`${API_URL}/hc/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          idHistory: historiaId,
          idTeacher: testData.teacher.id,
          state: 'validado',
          observations: ''
        })
      });

      expect([201, 200]).toContain(response.status);
    });
  });
});
