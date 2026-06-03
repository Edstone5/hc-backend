# ADR-0039 — Validación docente / Evaluaciones: rol, gating y resultados

- **Estado:** Aceptado
- **Fecha:** 2026-06-02
- **Rama:** `feature/odontograma-nts150`
- **Ámbito:** `hc-backend` (middleware, rutas, repo/controller HC) + `hc-frontend`
  (ValidacionDocente, FichaEvaluacion) + `db` (seed)
- **Origen:** Análisis de por qué «Validación docente» no mostraba resultados y de
  la razón de ser / visibilidad de «Evaluaciones».

## Contexto / problema

1. **No existía el rol `docente`** (en BD solo `estudiante` y `admin`). La página
   `ValidacionDocente` se bloqueaba con `user.role === 'docente'`, de modo que
   **ningún usuario** podía usarla (ni el admin).
2. **«Validación docente» era de solo escritura:** hacía `POST /hc/review` y no
   consultaba ni mostraba revisiones; el backend tampoco tenía un GET. El único
   reflejo del resultado era el contador «Pendientes revisión» del panel admin.
3. **Sin gating de rol en el backend:** `POST /hc/review` y la evaluación de fichas
   solo pasaban por `authMiddleware`; la restricción «solo docente» era solo del
   cliente (cualquier autenticado podía escribir por API).
4. **«Evaluaciones» (Fichas de Evaluación):** el botón «Evaluar ficha» se mostraba
   a cualquiera; debía ser editable por docente/admin y de solo lectura para el
   estudiante (que necesita ver su nota y retroalimentación).

## Decisión

### Backend

- **`middlewares/requireRole.js`** (nuevo): autorización por rol tras
  `authMiddleware` (401 si no autenticado, 403 si rol no permitido).
- **Gating** `requireRole('docente', 'admin')` en:
  - `POST /hc/review`
  - `POST /:id/fichas-operacion/:idFicha/evaluacion`
- **Resultados de validación (GET):** nueva ruta `GET /hc/:id/reviews`
  (solo `authMiddleware` → el estudiante ve la retroalimentación de su propia
  historia). `HcController.listarRevisionesHistoriaClinica` +
  `HcRepository.listarRevisionesPorHistoria` (join `revision_historia` con
  `catalogo_estado_revision` y `usuario`, orden por fecha desc).
- **`db/seed-admin.mjs`** generalizado: acepta `[rol] [nombre] [apellido]`; el
  nombre por defecto depende del rol. Permite crear docentes de forma idempotente.

### Frontend

- **`ValidacionDocente`:** el formulario lo ven docente/admin; **todos** ven el
  «Historial de validaciones» (estado, fecha, observaciones, docente) cargado de
  `GET /hc/:id/reviews`. El estudiante obtiene así su retroalimentación.
- **`FichaEvaluacion`:** editar evaluaciones lo pueden docente/admin; el estudiante
  ve estado/puntaje/comentarios en solo lectura (botón de evaluar oculto).

### Visibilidad de menús

Se mantienen «Validación docente» y «Evaluaciones» visibles para todos los roles
**a propósito**: ahora ambas tienen vista de solo lectura para el estudiante (su
retroalimentación y notas). El control real de escritura está en el backend
(`requireRole`) y reforzado en la UI. No se ocultan del menú para no privar al
estudiante de ver sus resultados.

## Verificación

- **API (end-to-end):**
  - Docente (`docente1`): `POST /hc/review` → **201**; `GET /hc/:id/reviews`
    devuelve la revisión (estado, fecha, docente, observaciones).
  - Estudiante: `POST /hc/review` → **403**; `GET /hc/:id/reviews` → **200**.
  - Sin token: **401**.
- **Datos de prueba:** `docente1` / `esis123` (rol docente). (Para pruebas de 403 se
  usó un estudiante con código numérico; el seed deriva el `dni` de los dígitos del
  código, por lo que conviene usar códigos con dígitos.)
- Norma de Oro: backend `npm test` **1468**; frontend `eslint src` 0 ·
  `vite build` OK · `test:run` **136**.

## Limitaciones / mejoras futuras

- `POST /hc/review` actualiza el historial de revisiones pero no cambia el `estado`
  de la `historia_clinica`; el «flujo de aprobación» completo (cambiar estado de la
  HC, notificar al estudiante) queda como mejora futura.
- El menú de la HC sigue mostrando todas las secciones a todos los roles; un
  rediseño de navegación por rol (vista docente vs estudiante) excede este ADR.
