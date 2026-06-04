# Guía de instalación local (Onboarding)

Sistema de **Historia Clínica Odontológica** — UNJBG / ESIS.
Esta guía explica cómo dejar el proyecto corriendo en tu máquina **desde cero**.
Cubre los dos repositorios:

- **`hc-backend`** — API (Node.js, arquitectura hexagonal/DDD, PostgreSQL).
- **`hc-frontend`** — App web (React 18 + Vite).

> TL;DR: instala **Node 20**, haz `npm install` en cada repo, crea los **`.env.local`**
> (con un `DATABASE_URL` válido y los secretos JWT), y corre `npm run dev` en cada uno.
> Lo único que **no** viene en el repositorio y debes conseguir del equipo son: el
> `DATABASE_URL` de la base de datos y los secretos JWT.

---

## 1. Requisitos previos (instalar una sola vez)

| Herramienta                     | Versión             | Notas                                                                                                   |
| ------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Node.js**                     | **20.x LTS**        | El proyecto se construye sobre `node:20-alpine`. Otras versiones pueden fallar. Verifica con `node -v`. |
| **npm**                         | (incluido con Node) | `npm -v`                                                                                                |
| **Git**                         | cualquiera reciente | Para clonar y versionar.                                                                                |
| **Docker Desktop** _(opcional)_ | —                   | Solo si quieres levantar con `docker-compose` en vez de a mano.                                         |

> **argon2 (hash de contraseñas):** normalmente trae binarios precompilados para Node 20
> y `npm install` funciona sin más. Si fallara la compilación en Windows, instala
> _Visual Studio Build Tools_ (C++) y Python, luego reintenta `npm install`.

---

## 2. Clonar los repositorios

```bash
git clone <url-hc-backend>   hc-backend
git clone <url-hc-frontend>  hc-frontend
```

---

## 3. Instalar dependencias

```bash
cd hc-backend  && npm install
cd ../hc-frontend && npm install
```

---

## 4. Variables de entorno (⚠️ el paso clave)

Los archivos `.env.local` **NO** están en el repositorio (son privados: están en
`.gitignore`). Al clonar **no** los obtienes; hay que crearlos.

> **Importante:** el `.env.local` es **solo configuración**: contiene la _dirección_
> (`DATABASE_URL`) hacia una base de datos que vive **fuera** del repo (ver §5).
> El `.env.local` no contiene los datos.

### 4.1 Backend — `hc-backend/.env.local`

```dotenv
# Conexión a PostgreSQL (NeonDB). Pídela al equipo (ver §5).
DATABASE_URL=postgresql://USUARIO:PASSWORD@HOST.neon.tech/BASEDATOS?sslmode=require

# Secretos JWT (pídelos al equipo o genera los tuyos si usas tu propia BD).
JWT_SECRET=<64 bytes hex>
JWT_REFRESH_SECRET=<64 bytes hex>

# Servidor
PORT=3000
NODE_ENV=development
```

Para generar un secreto seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **Nota:** el archivo `.env.example` del repo está desactualizado (muestra variables
> estilo MySQL `DB_HOST/DB_USER/...`). El código real (`db/db.js`) usa **`DATABASE_URL`**.
> Usa la plantilla de arriba.

### 4.2 Frontend — `hc-frontend/.env.local`

```dotenv
VITE_API_URL=http://localhost:3000/api
```

### 4.3 ⚠️ Cómo crear los `.env.local` correctamente (Windows)

Son archivos de **texto plano** pero su **nombre** es literal `.env.local`
(empieza con punto, **sin** extensión `.txt`). El Bloc de notas/Explorador suele
añadir `.txt` por error y entonces el proyecto **no lo lee**.

- **VS Code:** clic derecho en la carpeta → _New File_ → escribe `.env.local`.
- **PowerShell:** `New-Item -ItemType File -Name ".env.local"`
- **Git Bash:** `touch .env.local`

Verifica el nombre exacto con `ls -a` (Git Bash) o `Get-ChildItem -Force` (PowerShell):
debe aparecer **`.env.local`**, nunca `.env.local.txt`.

---

## 5. Base de datos

El backend necesita una **PostgreSQL real, encendida y alcanzable**. El `DATABASE_URL`
del `.env.local` apunta a ella. Hay dos caminos:

### Opción A — Usar la NeonDB compartida del equipo _(recomendada)_

- **NeonDB** es PostgreSQL **en la nube** (serverless): no instalas nada local.
- Pega en tu `.env.local` el **mismo `DATABASE_URL`** que usa el equipo.
- Esa base ya tiene el **esquema + usuarios + datos sembrados**, así que **no hay más
  pasos**: solo necesitas conexión a internet.

### Opción B — Tu propia base de datos _(avanzado)_

Solo si no usas la compartida. Crea un PostgreSQL propio (local o tu propia cuenta
Neon), pon su `DATABASE_URL` en el `.env.local` y luego:

```bash
cd hc-backend
npm run db:migrate                                  # crea/actualiza el esquema
node db/seed-admin.mjs 2023-119013 esis123 admin    # usuario admin
node db/seed-admin.mjs docente1 esis123 docente Docente Pruebas   # usuario docente
node db/seed-reporte-odontograma.mjs                # datos para Reportes (RF-12)
```

> El esquema base (`db/init.sql`) está escrito en sintaxis MySQL; el runtime soporta
> ambos motores vía `db/db.js`. Si vas por la Opción B, **coordina con el equipo** el
> bootstrap del esquema en Postgres para evitar diferencias.

---

## 6. Levantar el proyecto

En dos terminales:

```bash
# Terminal 1 — API
cd hc-backend && npm run dev          # http://localhost:3000  (Swagger: /api/api-docs)

# Terminal 2 — Web
cd hc-frontend && npm run dev         # http://localhost:5173
```

Abre **http://localhost:5173** en el navegador.

> **Alternativa con Docker (Opción avanzada):** `cd hc-backend && docker-compose up`.

---

## 7. Credenciales de prueba (ya sembradas en la BD compartida)

| Rol        | Usuario       | Password  |
| ---------- | ------------- | --------- |
| Admin      | `2023-119013` | `esis123` |
| Docente    | `docente1`    | `esis123` |
| Estudiante | `2099-000001` | `esis123` |

---

## 8. Verificar que todo funciona

1. `node -v` → `v20.x`.
2. La web carga el login en `http://localhost:5173`.
3. Inicias sesión con `2023-119013` / `esis123` y entras al panel **admin**.
4. (Opcional) `http://localhost:3000/api/api-docs` muestra el Swagger del backend.

---

## 9. Solución de problemas

| Síntoma                               | Causa probable                           | Solución                                                                     |
| ------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| El login se queda “cargando” o da 500 | El backend no alcanza la BD              | Revisa `DATABASE_URL` en `hc-backend/.env.local` (correcto y con internet).  |
| `No token provided` / 401 al navegar  | No iniciaste sesión o cookies bloqueadas | Inicia sesión; asegúrate de usar `http://localhost`.                         |
| La web no llama al backend            | `VITE_API_URL` mal                       | Debe ser `http://localhost:3000/api`. Reinicia `npm run dev` tras cambiarlo. |
| El `.env.local` “no se aplica”        | Se guardó como `.env.local.txt`          | Renómbralo al nombre exacto `.env.local` (§4.3).                             |
| `npm install` falla en argon2         | Faltan build tools (Windows)             | Instala VS Build Tools (C++) + Python y reintenta.                           |
| Puerto 3000/5173 ocupado              | Otro proceso usa el puerto               | Cierra el proceso o cambia `PORT` (backend) / `--port` (Vite).               |

---

## 10. Flujo de trabajo (convenciones del equipo)

- Trabaja en la rama de feature indicada por el equipo (p. ej. `feature/odontograma-nts150`).
- Los hooks de **husky** corren **lint + tests + commitlint** al hacer commit.
- **Conventional commits** en minúscula: `feat(scope): ...`, `fix(scope): ...`, `docs: ...`.
- Antes de subir: backend `npm test`; frontend `npm run test:run` + `npx eslint src`.
- Editor recomendado: **VS Code** con extensiones **ESLint** y **Prettier**
  (las configuraciones ya están en cada repo).

---

### Resumen de lo que NO viene al clonar y debes conseguir del equipo

1. El **`DATABASE_URL`** de la NeonDB compartida.
2. Los **secretos JWT** (`JWT_SECRET`, `JWT_REFRESH_SECRET`).

Con eso + Node 20 + `npm install`, ya puedes desarrollar en local.
