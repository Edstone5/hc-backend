# ADR-0019 — Refresco automático de sesión (JWT) ante expiración del access token

**Fecha:** 2026-05-31
**Estado:** Aceptado
**Ramas:** `feature/odontograma-nts150` (hc-backend y hc-frontend)

---

## Contexto

Durante las pruebas en navegador, al guardar el odontograma y al guardar en
**Diagnóstico en clínicas** aparecía el error **"Invalid token"**. El diagnóstico
mostró que es un problema **transversal de autenticación**, no del odontograma:

- El **access token** (JWT en cookie httpOnly) expira a los **15 minutos**
  (`TokenService.generateAccessToken`, `expiresIn: '15m'`).
- Tras expirar, `authMiddleware` responde **401 "Invalid token"** a cualquier
  petición autenticada (guardados, notificaciones, etc.).
- En el login se emite un **refresh token** (7 días, cookie httpOnly), **pero no
  existía ningún endpoint que lo usara** para reemitir el access token, ni lógica
  de renovación en el cliente. `TokenService.saveRefreshToken` era un stub.
- Resultado: tras 15 min de sesión, todo guardado fallaba hasta re-login.

Nota adicional: la cookie del access token tenía `maxAge` de 2 h mientras el JWT
dura 15 min, de modo que la cookie seguía presente (se enviaba) pero su contenido
ya no verificaba → 401.

---

## Decisión

Implementar el **flujo de refresh token estándar**, manteniendo el access token
corto (buena práctica de seguridad) y renovándolo automáticamente.

### Backend (`hc-backend`)

- `TokenService.verifyRefreshToken(token)` — verifica con `JWT_REFRESH_SECRET`.
- `CookieService.setAccessCookie(res, accessToken)` — reemite **solo** la cookie
  del access token (el refresh token sigue vigente).
- `AuthRepository.obtenerUsuarioPorId(id)` — necesario para reconstruir el payload
  del access token (userCode, rol) a partir del `id` del refresh token.
- `AuthController.refrescarSesion(req, res)` — lee la cookie `refreshToken`, la
  verifica, recupera el usuario y reemite el access token. Devuelve 401 si el
  refresh token falta/expiró/es inválido o el usuario ya no existe.
- Ruta `POST /api/users/refresh`, registrada **antes** de `authMiddleware` (debe
  funcionar precisamente cuando el access token ya expiró).

### Frontend (`hc-frontend`)

- `src/services/authRefresh.js` (`installAuthRefresh`): envuelve `window.fetch`
  **una sola vez** (instalado en `main.jsx`). Ante un **401 de la API**, llama a
  `POST /users/refresh` y **reintenta** la petición original una vez. Si el refresh
  falla, devuelve el 401 original (sesión realmente caída → re-login).
  - Agrupa refrescos concurrentes en una sola promesa (`refreshing`) para evitar N
    renovaciones simultáneas cuando varias peticiones reciben 401 a la vez.
  - No intercepta los endpoints `/users/login|logout|refresh` ni reintenta más de
    una vez (`__retried`) para evitar bucles.

---

## Alternativas consideradas

- **Subir la expiración del access token (p.ej. 8 h):** descartado por el equipo;
  resuelve el síntoma pero debilita la seguridad (token válido más tiempo si se
  filtra) y no aprovecha el refresh token ya existente.
- **Modificar cada servicio `fetch` para reintentar:** descartado; hay decenas de
  llamadas directas. El wrapper global las cubre todas sin tocarlas.
- **Interceptor de Axios:** el proyecto usa `fetch` nativo, no Axios.

---

## Consecuencias

- Las sesiones duran de forma efectiva hasta 7 días (vida del refresh token) sin
  re-login, manteniendo access tokens cortos (15 min) renovados de forma transparente.
- Desaparece el "Invalid token" al guardar odontograma, diagnóstico y demás módulos.
- **Seguridad:** no se rota el refresh token en cada refresh (simplicidad). Trabajo
  futuro posible: rotación de refresh token y lista de revocación
  (`saveRefreshToken` sigue siendo un stub).

---

## Verificación

- Nuevo test `test/auth.refresh.test.js` (6 casos: sin token, token inválido, tipo
  incorrecto, usuario inexistente, éxito 200 + `setAccessCookie`, error 500).
- Backend: `npm test` → **1435 passing** (1429 previos + 6).
- Frontend: `npx vite build` OK; `npx eslint src` → 0 errores.
- Pendiente de verificación en vivo: dejar expirar el access token (o borrar la
  cookie `accessToken`) y confirmar que el siguiente guardado se renueva y completa
  sin re-login.
