# ADR-0003: Migración de PostgreSQL a MySQL

- **Estado:** Aceptado ✅
- **Fecha de propuesta:** 2026-05-28
- **Fecha de implementación:** 2026-05-29
- **Módulos afectados:** `db/db.js`, los 19 repositorios de infraestructura,
  `package.json`, `test/db.test.js`

---

## Contexto y declaración del problema

El docente del curso requiere demostrar que la Arquitectura Hexagonal permite
intercambiar la tecnología de base de datos sin modificar el dominio ni la
aplicación. El sistema originalmente usa **PostgreSQL** (driver `pg`).

La demostración consiste en migrar a **MySQL** tocando únicamente la capa de
infraestructura, de modo que un `grep` del código demuestre que ningún archivo
de dominio ni de aplicación tiene conocimiento del driver nuevo.

---

## Factores de decisión

| Restricción           | Detalle                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| Dominio inalterado    | `*/domain/*.js` no puede cambiar ninguna línea                               |
| Aplicación inalterada | `*/application/*.js` no puede cambiar ninguna línea                          |
| Capa modificable      | `db/db.js`, `*/infrastructure/*Repository.js`, `package.json`                |
| Placeholders          | MySQL usa `?`; PostgreSQL usa `$1, $2, …`                                    |
| Type-casts            | MySQL no admite `$1::uuid`; hay que eliminarlos                              |
| NULLS LAST            | MySQL no admite `ORDER BY campo DESC NULLS LAST`                             |
| RETURNING             | MySQL no admite `INSERT … RETURNING *`                                       |
| SRFs                  | PostgreSQL permite `SELECT * FROM fn_()` (set-returning functions); MySQL no |
| Funciones escalares   | `SELECT fn_() AS alias` funciona igual en PostgreSQL y MySQL                 |
| Respuesta del driver  | `pg` → `result.rows`; `mysql2` → `[rows, fields]`                            |
| Tests existentes      | 1105 Vitest + 91 Cucumber deben continuar pasando sin un servidor real       |

---

## Opciones consideradas

### Opción A — Wrapper de compatibilidad en `db/db.js` _(elegida)_

Reemplazar `db/db.js` con una implementación `mysql2/promise` que exponga
exactamente la misma firma `pool.query(sql, params) → { rows }` que ya esperan
los 19 repositorios.

**Pros:** mínimos cambios en repositorios, fácil de revertir, sin tocar
dominio ni aplicación.

**Contras:** `mysql2` tiene diferencias de respuesta según el tipo de
sentencia (SELECT, DML, CALL) que el wrapper debe normalizar.

### Opción B — Reescribir repositorios con SQL directo (sin SPs)

Reemplazar todas las llamadas a stored procedures por `INSERT`/`UPDATE`/`SELECT`
directo en cada repositorio.

**Pros:** más portable, sin depender de lógica almacenada en BD.

**Contras:** mayor esfuerzo (~59 queries); se aleja del diseño original
aprobado por el docente.

---

## Resultado de la decisión

Se adopta la **Opción A**. El wrapper de compatibilidad es la pieza central
que absorbe todas las diferencias entre drivers y mantiene los repositorios
casi sin cambios.

---

## Implementación realizada

### 1 — Dependencias (`package.json`)

```bash
npm install mysql2   # añade mysql2 ^3.x a dependencies
# pg eliminado manualmente de package.json
```

`pg` se elimina del árbol de dependencias porque ningún archivo lo importa
tras la migración.

---

### 2 — Nuevo `db/db.js`: diseño del wrapper

#### Decisión 2a — Objeto wrapper, no pool directo

**Problema:** `mysql2` no expone la misma firma que `pg`.
`pg.Pool.query()` devuelve `{ rows }`.
`mysql2Pool.query()` devuelve `[result, fields]`, donde `result` varía
según el tipo de sentencia.

**Solución:** exportar un objeto `pool` con un único método `query` que
normaliza siempre la respuesta a `{ rows }`:

```js
const pool = {
  async query(sql, params = []) {
    const [result] = await mysqlPool.query(sql, params ?? []);

    // CALL con SELECT interno → result = [[...filas...], OkPacket]
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return { rows: result[0] };
    }
    // SELECT normal → result = [{ col: val }, ...]
    if (Array.isArray(result)) {
      return { rows: result };
    }
    // INSERT / UPDATE / DELETE / CALL sin SELECT → result = OkPacket
    return { rows: [] };
  },
};
```

| Tipo de sentencia        | mysql2 devuelve             | Wrapper devuelve   |
| ------------------------ | --------------------------- | ------------------ |
| SELECT                   | `[rows[], fields]`          | `{ rows: rows[] }` |
| CALL proc() con SELECT   | `[[rows[], OkPacket], ...]` | `{ rows: rows[] }` |
| CALL proc() sin SELECT   | `[[OkPacket], fields]`      | `{ rows: [] }`     |
| INSERT / UPDATE / DELETE | `[OkPacket, fields]`        | `{ rows: [] }`     |

#### Decisión 2b — `testConnection` usa `pool.query`, no `pool.getConnection`

**Problema:** el plan inicial usaba `pool.getConnection()` para verificar la
conexión. Eso hace imposible el testeo unitario: en los tests (NODE_ENV=test)
no existe un servidor MySQL real, y `pool.getConnection()` no se puede mockear
con la técnica `pool.query = vi.fn()` que ya usa `test/db.test.js`.

**Solución:** `testConnection` llama a `pool.query('SELECT 1')`, el mismo
método que los tests mockean. Así, el test reemplaza `pool.query` con un
`vi.fn()` y controla el resultado sin necesidad de servidor:

```js
async function testConnection(log = console.log, errorLog = console.error) {
  try {
    await pool.query('SELECT 1'); // ← misma referencia que mockea el test
    log('Conectado a MySQL');
  } catch {
    errorLog('Error al conectar a MySQL');
  }
}
```

El test existente no requirió ningún cambio estructural; solo se actualizó
el literal del mensaje: `"Conectado a Postgres"` → `"Conectado a MySQL"`.

---

### 3 — Migración de los 19 repositorios

#### Decisión 3a — Placeholders y type-casts (aplicado a los 19 archivos)

| Patrón PostgreSQL                      | Patrón MySQL | Motivo                                         |
| -------------------------------------- | ------------ | ---------------------------------------------- |
| `$1, $2, …, $N`                        | `?`          | MySQL usa marcadores posicionales anónimos     |
| `$1::uuid`                             | `?`          | MySQL no tiene type-casting inline en queries  |
| `$2::date`, `$3::varchar`, `$5::jsonb` | `?`          | Ídem; el driver infiere o la BD valida el tipo |

Se aplicó mediante reemplazo de expresión regular `\$\d+(::\w+)?` → `?`
sobre todos los archivos `*/infrastructure/*Repository.js`.

#### Decisión 3b — `ORDER BY … NULLS LAST` (2 archivos)

`NULLS LAST` no existe en MySQL. La semántica equivalente es colocar los
`NULL` al final en orden descendente, lo que se logra con una expresión de
ordenación compuesta:

```sql
-- PostgreSQL
ORDER BY fecha DESC NULLS LAST LIMIT 1

-- MySQL
ORDER BY fecha IS NULL, fecha DESC LIMIT 1
```

`fecha IS NULL` evalúa a `1` para filas con NULL y a `0` para el resto;
al ordenar ASC (por defecto), los NULL quedan al final.

Afectados: `diagnosticoPresuntivo/infrastructure/diagnosticoPresuntivoRepository.js`
y `diagnosticoClinicas/infrastructure/diagnosticoClinicasRepository.js`.

#### Decisión 3c — `INSERT … RETURNING *` → INSERT + SELECT (2 archivos)

MySQL no admite la cláusula `RETURNING`. Los dos repositorios que la usaban
(`examenGeneral`, `examenRegional`) crean el registro y luego lo recuperan
en una segunda consulta por `id_historia` (siempre `params[0]`):

```js
// Antes (PostgreSQL)
const { rows } = await pool.query(
  `INSERT INTO examen_general (...) VALUES (...) RETURNING *`,
  agregado.obtenerParametros()
);
return rows[0];

// Después (MySQL)
const params = agregado.obtenerParametros();
await pool.query(`INSERT INTO examen_general (...) VALUES (...)`, params);
const { rows } = await pool.query(
  'SELECT * FROM examen_general WHERE id_historia = ?',
  [params[0]]
);
return rows[0];
```

**Motivo de usar `params[0]`:** en ambas tablas, `id_historia` es siempre
el primer parámetro del agregado, según la convención establecida en
`obtenerParametros()`.

#### Decisión 3d — Funciones PostgreSQL: SRFs vs funciones escalares

PostgreSQL distingue dos tipos de funciones relevantes:

| Tipo                    | Ejemplo PostgreSQL                     | Comportamiento                               | MySQL equivalente                                                  |
| ----------------------- | -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| **SRF** (set-returning) | `SELECT * FROM fn_obtener_usuario($1)` | Retorna una tabla (múltiples filas/columnas) | `CALL fn_obtener_usuario(?)` — stored procedure con SELECT interno |
| **Escalar**             | `SELECT fn_crear_paciente($1,…) AS id` | Retorna un único valor                       | `SELECT fn_crear_paciente(?,…) AS id` — función MySQL (sin cambio) |

Las **SRFs** se convierten a `CALL proc()`. Con el wrapper (Decisión 2a),
el resultado del CALL se normaliza automáticamente a `{ rows: result[0] }`.

Las **funciones escalares** se mantienen con `SELECT fn() AS alias` porque
MySQL las soporta nativamente con la misma sintaxis.

Archivos donde se aplicó la conversión SRF → CALL:

| Repositorio      | Función convertida                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `hc`             | `fn_crear_historia_clinica`, `fn_asignar_paciente_a_historia`, `fn_obtener_paciente_por_historia` |
| `user`           | `fn_obtener_usuario`, `fn_obtener_usuario_login`                                                  |
| `auth`           | `fn_obtener_usuario_login`                                                                        |
| `listaHcAdultos` | `fn_listar_historias_clinicas_adultos_por_estudiante`                                             |

Funciones escalares mantenidas sin cambio (solo `$N` → `?`):

| Repositorio | Función                                         |
| ----------- | ----------------------------------------------- |
| `hc`        | `fn_obtener_o_crear_borrador(?) AS id_historia` |
| `patient`   | `fn_crear_paciente(?, …, ?) AS id_paciente`     |

---

### 4 — Stored procedures en MySQL

Los stored procedures que reemplazan las SRFs de PostgreSQL deben recrearse
en el servidor MySQL antes de usar el sistema en producción. La conversión
de tipos sigue esta tabla:

| PostgreSQL   | MySQL        |
| ------------ | ------------ |
| `UUID`       | `CHAR(36)`   |
| `TEXT`       | `TEXT`       |
| `VARCHAR(n)` | `VARCHAR(n)` |
| `DATE`       | `DATE`       |
| `JSONB`      | `JSON`       |
| `BOOLEAN`    | `TINYINT(1)` |
| `INTEGER`    | `INT`        |

Ejemplo de conversión:

```sql
-- PostgreSQL
CREATE OR REPLACE PROCEDURE i_evolucion(
  p_id_historia UUID,
  p_fecha       DATE,
  p_actividad   TEXT,
  p_alumno      VARCHAR(200),
  p_id_usuario  UUID
) LANGUAGE plpgsql AS $$ BEGIN … END; $$;

-- MySQL
CREATE PROCEDURE i_evolucion(
  IN p_id_historia CHAR(36),
  IN p_fecha       DATE,
  IN p_actividad   TEXT,
  IN p_alumno      VARCHAR(200),
  IN p_id_usuario  CHAR(36)
)
BEGIN … END;
```

---

### 5 — Verificación de arquitectura hexagonal ✅

```bash
# Comando de demostración al docente:
grep -rn "mysql2\|from '../../db/db.js'" --include="*.js" \
     --exclude-dir=node_modules | grep -v "infrastructure" | grep -v "db/db.js"

# Resultado obtenido: sin output (0 coincidencias)
```

Ningún archivo de dominio (`*/domain/*.js`) ni de aplicación
(`*/application/*.js`) referencia el driver ni el pool.

---

## Consecuencias

### Positivas

- **Demostración empírica completada:** ninguna línea de dominio ni de
  aplicación cambió durante la migración de motor de base de datos.
- **Tests sin regresos:** 1105/1105 Vitest y 91/91 Cucumber pasan después
  de la migración.
- **Wrapper reutilizable:** si en el futuro se migra a otro motor (SQLite,
  MariaDB, etc.), solo `db/db.js` necesita cambiar.
- **Reversibilidad total:** restaurar `db/db.js` y los repositorios al estado
  anterior es suficiente para volver a PostgreSQL.

### Pendiente (fuera del alcance de esta PR)

- Los stored procedures deben recrearse en el servidor MySQL de producción.
  El script de migración SQL no está incluido en este repositorio; se
  entregará como artefacto separado.

### Negativas / riesgos aceptados

- El wrapper oculta diferencias sutiles de `mysql2` (e.g., tipos de datos
  devueltos, precisión decimal). Si aparecen discrepancias en producción,
  se pueden resolver en el wrapper sin tocar los repositorios.
