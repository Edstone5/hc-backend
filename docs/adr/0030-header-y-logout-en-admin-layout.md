# ADR-0030 — Barra superior (Header) y logout en el layout de administración

- **Estado:** Aceptado
- **Fecha:** 2026-06-01
- **Rama:** `feature/odontograma-nts150` (hc-frontend)
- **Ámbito:** `hc-frontend` (`layouts/AdminLayout.jsx`)

## Contexto

En modo administrador, al navegar a cualquier vista bajo `/admin/*` (Buscar HC,
Reportes, Reporte Odontograma, Equipos, detalle de estudiante…) **desaparecía toda
la barra superior y no había forma de cerrar sesión**.

Causa: el usuario admin aterriza en `/dashboard` (que usa `StudentLayout`, con su
`Header` y logout), pero las tarjetas del panel navegan a rutas `/admin/*`, las
cuales usan `AdminLayout`. Ese layout renderizaba únicamente `<Outlet/>` —sin
`Header`—, de modo que la barra (y el botón de logout que vive en ella)
desaparecían al entrar a cualquier sección admin.

## Decisión

`AdminLayout` ahora renderiza el mismo `Header` compartido (logo + campana de
notificaciones + botón de logout) por encima del `<Outlet/>`, dentro de un
contenedor flex de pantalla completa. Se omite el tab «HISTORIA CLÍNICA» de
`StudentLayout`, que no aplica al contexto administrativo.

## Alternativas consideradas

- **Redirigir al admin a `/admin` tras el login en vez de `/dashboard`:** cambio
  más amplio en el enrutado/Dashboard; no resuelve la ausencia de barra en las
  vistas admin. Se puede abordar aparte.
- **Duplicar un header propio de admin:** se descarta para no duplicar el logout ni
  la campana; se reutiliza el componente `Header` existente.

## Consecuencias

- Todas las vistas `/admin/*` muestran la barra superior con logout y
  notificaciones, de forma consistente con el resto de la app.
- Sin cambios de API ni de datos.

## Verificación (Norma de Oro)

- `npx eslint src` → 0 errores.
- `npx vite build` → OK.
- `npm run test:run` → 136 passing.
- Manual: login admin → entrar a cada sección `/admin/*` → la barra y el logout
  permanecen visibles y el cierre de sesión funciona.
