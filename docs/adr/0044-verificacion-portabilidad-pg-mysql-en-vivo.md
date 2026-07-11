# ADR-0044 — Verificación en vivo de la portabilidad del puerto de persistencia (PostgreSQL↔MySQL) y consolidación de la ruta central

- **Estado:** Aceptado ✅
- **Fecha:** 2026-07-10
- **Decisores:** Grupo 2 — Vaca Code
- **Relación:** complementa y actualiza [ADR-0003](0003-plan-migracion-postgresql-mysql.md)
  (diseño del intercambio de motor) y se apoya en [ADR-0002](0002-puertos-repositorio-en-dominio.md)
  (puertos de repositorio) y [ADR-0028](0028-rotacion-refresh-token-y-revocacion.md) (tabla `refresh_token`).
- **Módulos afectados:** `db/db.js`, `db/init.sql`, `db/migrate.js`,
  `auth/infrastructure/authRepository.js`, `user/infrastructure/userRepository.js`,
  `hc/infrastructure/hcRepository.js`, `filiacion/infrastructure/filiacionRepository.js`,
  `docker-compose.mvp.yml`, `mvp/demo_seed.sql`, `mvp/prueba_ruta_central.sh`

---

## Contexto y declaración del problema

El [ADR-0003](0003-plan-migracion-postgresql-mysql.md) estableció que la Arquitectura
Hexagonal permite intercambiar el motor de base de datos tocando solo la capa de
infraestructura. Desde entonces `db/db.js` evolucionó de un _swap_ estático a un
**adaptador dual dinámico**: elige el motor por el prefijo de `DATABASE_URL`
(`postgresql://` → `pg`; `mysql://` → `mysql2`), expone `pool.dialect` y convierte los
marcadores posicionales `$N` a `?` para MySQL.

Sin embargo, la portabilidad estaba **demostrada por lectura del código, no verificada en
ejecución** sobre un MySQL real. El docente puede pedir la demostración en vivo, y varias
incompatibilidades solo aparecen al ejecutar la ruta clínica de extremo a extremo, no al
leer los repositorios. Se necesitaba (1) una forma de correr el **mismo artefacto** contra
ambos motores a la vez y (2) cerrar las brechas encontradas, sin romper `npm run dev`
contra NeonDB ni la suite de pruebas.

---

## Decisión

### 1 — Verificación con backend dual simultáneo (Docker Compose)

Se añade al `docker-compose.mvp.yml` un **perfil `mysql`** que levanta, junto al backend
sobre PostgreSQL (`:3000`), un segundo backend **con el mismo build** apuntado a MySQL 8
(`:3001`). La **única diferencia entre ambos es `DATABASE_URL`**. Un migrador one-shot
dialect-aware (`db/migrate.js`, pasos 001–007) crea sobre MySQL las tablas que el esquema
base no trae (`refresh_token`, `informe_final`), y un seed simétrico (`mvp/demo_seed.sql`)
siembra la misma credencial de demostración en ambos motores.

La ruta clínica **central** —login → registrar historia → crear paciente → asignar paciente
→ guardar filiación → listar → buscar → leer— se ejerce con `mvp/prueba_ruta_central.sh`
contra cada motor.

### 2 — Consolidación de la portabilidad de la ruta central

Se corrigen las incompatibilidades reales que impedían que el **mismo código** corriera
sobre ambos dialectos:

| Artefacto                                | Incompatibilidad encontrada                                                                                                                                                                               | Decisión                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `authRepository.js`, `userRepository.js` | La rama dialect-aware forzaba la columna `user_code` en MySQL, pero el `init.sql` actual ya está armonizado con Neon y usa `codigo_usuario`. Rompía el login sobre MySQL.                                 | Unificar en `codigo_usuario` / `contrasena_hash` para ambos dialectos (se retira la rama obsoleta).                            |
| `hcRepository.buscarHistorias`           | `ILIKE` y `CAST(... AS VARCHAR)` son PG-only; además se reutilizaba `$idx` 4 veces, lo que con el conversor posicional `$N→?` produce más `?` que parámetros (`Incorrect arguments to COM_STMT_EXECUTE`). | Operador y CAST por dialecto (`LIKE`/`ILIKE`, `CHAR`/`VARCHAR`) y **un placeholder independiente por columna** (4 parámetros). |
| `filiacionRepository.create`             | La PK `id_filiacion` dependía del `DEFAULT gen_random_uuid()` de PostgreSQL; MySQL no lo tiene → violación de `NOT NULL`.                                                                                 | Generar la PK en la aplicación con `randomUUID()` (patrón ya usado por `patient`/`hc`). Portable a cualquier motor.            |
| `db/init.sql`                            | 13 sentencias `CREATE INDEX IF NOT EXISTS` (sintaxis PG) abortaban el init en MySQL 8, dejando tablas sin crear y el seed sin ejecutar.                                                                   | Corregir a `CREATE INDEX` (MySQL no admite `IF NOT EXISTS` en índices; el init corre una vez sobre BD nueva).                  |

### 3 — Estado de dominio de la historia: `'activo'` → `'en_proceso'`

`crearHistoriaClinica` y `asignarPaciente` escribían `estado = 'activo'`, un valor **fuera
del dominio declarado** por `chk_historia_clinica_estado` en PostgreSQL
(`borrador | en_proceso | completada | aprobada | rechazada`) y **no mapeado** en la UI.
Se corrige a **`'en_proceso'`**, que sí es un estado de primera clase (validado por el CHECK
y con _badge_ propio en el frontend). Ningún componente lee `historia.estado === 'activo'`.

---

## Verificación realizada

```bash
cd hc-backend
docker compose -f docker-compose.mvp.yml --profile mysql up -d --build
BASE=http://localhost:3000/api  bash mvp/prueba_ruta_central.sh   # PostgreSQL -> 8/8
BASE=http://localhost:3001/api  bash mvp/prueba_ruta_central.sh   # MySQL      -> 8/8
```

| Paso de la ruta central         | Endpoint                             | PostgreSQL (:3000) | MySQL (:3001) |
| ------------------------------- | ------------------------------------ | ------------------ | ------------- |
| Autenticación                   | `POST /api/users/login`              | 200                | 200           |
| Registrar historia              | `POST /api/hc/register`              | 201                | 201           |
| Crear paciente                  | `POST /api/patients`                 | 201                | 201           |
| Asignar paciente (`en_proceso`) | `PATCH /api/hc/assign-patient`       | 200                | 200           |
| Guardar filiación               | `POST /api/hc/filiacion`             | 201                | 201           |
| Listar historias                | `GET /api/hc/student/:id`            | 200                | 200           |
| Buscar por paciente/DNI         | `GET /api/hc/search`                 | 200                | 200           |
| Leer filiación                  | `GET /api/hc/filiacion/historia/:id` | 200                | 200           |

Se confirmó además que la persistencia es real y distinta por motor (conteos de
`filiacion`/`historia_clinica` divergentes entre ambas BD). Las **149 pruebas** del código
afectado permanecen en verde y la ejecución con `npm run dev` contra NeonDB no se altera
(los cambios son retrocompatibles con PostgreSQL).

---

## Alternativas consideradas

- **Swap in-place** (bajar el backend PG y volver a subirlo apuntando a MySQL) en lugar de
  dos backends simultáneos. Descartado para la demo: el backend dual simultáneo evita
  tiempos muertos, permite comparar ambos motores lado a lado y es menos propenso a error
  en vivo.
- **Relajar el CHECK `chk_historia_clinica_estado`** para aceptar `'activo'`. Descartado:
  aflojar una restricción de integridad para acomodar un valor no-dominio es peor que
  alinear el código al dominio ya declarado. Se optó por `'en_proceso'`.
- **Añadir `DEFAULT (UUID())` a la PK en el esquema MySQL** en vez de generar el id en la
  app. Descartado: generar la PK en la aplicación es portable a cualquier motor y coherente
  con los repositorios `patient`/`hc`, sin depender de una característica del motor.

---

## Consecuencias

### Positivas

- **Portabilidad demostrada empíricamente:** el mismo artefacto de backend corre sobre
  PostgreSQL y MySQL con resultados idénticos en la ruta central; la única variable es
  `DATABASE_URL`. Es la evidencia más fuerte de la Arquitectura Hexagonal.
- **Menos ramas dialect-aware obsoletas:** al armonizar nombres de columna, el código de
  auth/usuario es más simple y correcto en ambos motores.
- **Reproducible y versionado:** el verificador `mvp/prueba_ruta_central.sh` y el perfil
  `mysql` del compose quedan como artefactos ejecutables.

### Negativas / riesgos aceptados

- Solo se verificó de extremo a extremo la **ruta central**. Otros módulos (reportes con
  `DATE_PART/AGE`, adjuntos, etc.) conservan SQL específico de PostgreSQL y requerirían el
  mismo tratamiento si se quisiera portar el sistema completo a MySQL.
- El seed y el backend-mysql son artefactos de **demostración** (credenciales y secretos de
  ejemplo); no son configuración de producción.
