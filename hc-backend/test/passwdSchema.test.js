import { describe, it, expect } from 'vitest';
import { validatePasswd } from '../schemas/passwdSchema.js';

describe('validatePasswd', () => {
  it('valida contraseña válida', () => {
    const result = validatePasswd('Abcdef1!');
    expect(result.success).toBe(true);
  });

  it('falla si es muy corta', () => {
    const result = validatePasswd('Abc1!');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('al menos 8 caracteres');
  });

  it('falla si no tiene mayúscula', () => {
    const result = validatePasswd('abcdefg1!');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('mayúscula');
  });

  it('falla si no tiene minúscula', () => {
    const result = validatePasswd('ABCDEFG1!');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('minúscula');
  });

  it('falla si no tiene número', () => {
    const result = validatePasswd('Abcdefg!');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('número');
  });

  it('falla si no tiene carácter especial', () => {
    const result = validatePasswd('Abcdefg1');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('carácter especial');
  });

  it('falla si es muy larga', () => {
    const result = validatePasswd('Abcdefg1!Abcdefg1!Abcdefg1!');
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('más de 20 caracteres');
  });
});
