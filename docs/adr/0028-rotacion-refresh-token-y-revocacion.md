# ADR-0028 — Rotación de refresh token + lista de revocación

- **Estado:** Aceptado
- **Fecha:** 2026-05-31
- **Rama:** `feature/odontograma-nts150` (hc-backend)
- **Ámbito:** `hc-backend` (auth); migración de BD nueva (006)
- **Relacionado:** ADR-0019 (refresco automático de sesión JWT — dejó `saveRefreshToken` como stub)

## Contexto

El ADR-0019 implementó el endpoint `POST /users/refresh` para renovar el access
token con el refresh token, pero dejó la **rotación y la revocación como trabajo
futuro**: `TokenService.saveRefreshToken` era un stub (`return true`) y el refresh
token no se persistía, de modo que no se podía invalidar (logout real, robo de
token) ni rotar. Un refresh token robado seguía siendo válido sus 7 días completos.

## Decisión

Persistir cada refresh token emitido y **rotarlo** en cada uso, con **lista de
revocación en BD** y **detección de reúso**. Se respeta la arquitectura hexagonal y
la compatibilidad dual MySQL/PostgreSQL del proyecto.

### Persistencia (migración 006, dual MySQL/PostgreSQL)

Tabla `refresh_token`:

| Columna           | Tipo               | Rol                                            |
| ----------------- | ------------------ | ---------------------------------------------- |
| `jti`             | UUID / CHAR(36)    | PK — identificador único del token (en el JWT) |
| `id_usuario`      | UUID / CHAR(36)    | FK a `usuario` (ON DELETE CASCADE)             |
| `revocado`        | BOOLEAN            | TRUE = inutilizable                            |
| `reemplazado_por` | UUID / CHAR(36)    | jti que lo sustituyó (cadena de rotación)      |
| `expira_en`       | DATETIME/TIMESTAMP | caducidad                                      |
| `created_at`      | DATETIME/TIMESTAMP | emisión                                        |

Se entrega como `db/migrations/006_refresh_token.sql` y como paso en el runner
idempotente `db/migrate.js` (`npm run db:migrate`), igual que las migraciones
002-005. No se aplica automáticamente a NeonDB (BD compartida); se corre una vez.

### Capas (hexagonal)

- **Dominio** (`auth/domain/authDomain.js`): el puerto `IAuthRepository` añade el
  contrato `guardarRefreshToken`, `obtenerRefreshToken`, `revocarRefreshToken`,
  `revocarTodosRefreshTokensDeUsuario`.
- **Infraestructura** (`auth/infrastructure/authRepository.js`): implementación SQL
  con parámetros posicionales (portable).
- **Servicio** (`services/tokenService.js`): `generateRefreshToken` ahora genera un
  `jti` (`randomUUID`), lo incluye en el payload del JWT y devuelve
  `{ token, jti, expiraEn }`. Se elimina el stub `saveRefreshToken`.
- **Aplicación** (`auth/application/authController.js`):
  - **login**: persiste el jti emitido.
  - **refresh**: valida que el jti exista y no esté revocado → emite tokens nuevos
    (access + refresh) → persiste el nuevo jti → revoca el usado enlazándolo
    (`reemplazado_por`) → reemite ambas cookies. **Detección de reúso**: si el jti
    llega ya revocado (token robado o reutilizado), se revocan **todos** los tokens
    del usuario y responde 401 `Refresh token reuse detected`.
  - **logout**: revoca el refresh token actual y limpia ambas cookies.

## Alternativas consideradas

- **Lista de revocación en memoria:** descartada; se pierde al reiniciar y no sirve
  multi-instancia. El usuario pidió explícitamente el enfoque de BD.
- **Solo rotación sin revocación:** insuficiente para logout real y robo de token.
- **Constraint/trigger en BD para la cadena:** innecesario; la lógica vive en la
  capa de aplicación y es testeable.

## Consecuencias

- Logout invalida de verdad el refresh token; un token robado puede cortarse.
- La rotación reduce la ventana de validez de un refresh token a un solo uso.
- La detección de reúso mitiga el robo de tokens (invalida la sesión completa).
- **Requiere aplicar la migración 006** a la BD (`npm run db:migrate`) antes de
  desplegar; mientras no se aplique, login/refresh fallarían al escribir en la tabla
  (trabajo de despliegue, no de código).

## Verificación (Norma de Oro)

- `test/auth.refresh.test.js` reescrito (9 casos: sin token, inválido, no-refresh,
  sin jti, jti inexistente, **reúso**, usuario inexistente, **rotación OK**, 500).
- `test/app.auth.controller.test.js`: login persiste el jti; logout revoca y limpia.
- `test/tokenService.test.js`: `generateRefreshToken` devuelve `{token, jti, expiraEn}`.
- Backend `npm test` → **1468 passing** (1465 + 3 netos).
- `npx eslint` de los archivos tocados → 0 errores.
