import { describe, it, expect, vi } from 'vitest';
import { CookieService } from '../services/cookieServices.js';

describe('CookieService', () => {
  it('setTokenCookies sets cookies with correct options', () => {
    const res = {
      cookie: vi.fn(),
      req: { headers: { origin: 'http://localhost' } },
    };
    CookieService.setTokenCookies(res, 'access', 'refresh');
    expect(res.cookie).toHaveBeenCalledWith(
      'accessToken',
      'access',
      expect.objectContaining({ httpOnly: true, path: '/' })
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh',
      expect.objectContaining({ httpOnly: true, path: '/' })
    );
  });
});
