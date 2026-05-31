export class CookieService {
  static setTokenCookies(res, accessToken, refreshToken) {
    const cookieOptions = {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    // console.log('🍪 Setting cookies with options:', cookieOptions);

    // console.log('🌐 Request origin:', res.req.headers.origin);

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 300 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  // Reemite SOLO la cookie del access token (usado por /users/refresh, que
  // mantiene el refresh token vigente y renueva el acceso tras su expiración).
  static setAccessCookie(res, accessToken) {
    const cookieOptions = {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });
  }
}
