# ADR-0042: Imagen de base de datos versionada en contenedor (Docker)

- **Estado:** Aceptada
- **Fecha:** 2026-06-19
- **Contexto:** Virtualización y despliegue (Lab Docker) — empaquetado reproducible de la BD

## Contexto

El `docker-compose.yml` de producción levantaba la base de datos con la imagen oficial
`mysql:8.0` y **montaba** `db/init.sql` como volumen de inicialización. Eso funciona, pero
acopla el contenido del esquema a un archivo del host y no produce un **artefacto
versionado y autocontenido** de la base de datos: la "versión" de la BD no es identificable
por sí sola ni se puede publicar/compartir como una unidad.

El laboratorio de Docker pide empaquetar una aplicación propia en una imagen; el docente
añade el requisito de **crear una imagen de nuestra base de datos versionada en un
contenedor**, manteniendo la disciplina de control de versiones.

El esquema ya está versionado por migraciones: `db/init.sql` (esquema canónico, que ya
incorpora las migraciones 001–005) más `db/migrations/006_refresh_token.sql` (ADR-0028).
Falta enlazar ese versionado del **esquema** con un versionado de la **imagen**.

## Decisión

Crear una imagen propia `hc-db` con su esquema **horneado** dentro (no montado):

1. **`db/Dockerfile`** parte de `mysql:8.0` y copia a `/docker-entrypoint-initdb.d/`:
   - `000_init.sql` ← `db/init.sql` (esquema canónico; incluye migraciones 001–005).
   - `006_refresh_token.sql` ← `db/migrations/006_refresh_token.sql` (delta sobre el canónico).
     No se re-aplican 002/003 porque usan `ALTER … ADD COLUMN` (no idempotente en MySQL) y
     sus columnas ya están en `init.sql`; reaplicarlas abortaría el arranque.
2. **Etiqueta = línea base.** La imagen se versiona como **`hc-db:1.1.0`**, el mismo número
   de la baseline firmada del proyecto (ADR-0040). Así, esquema, baseline e imagen comparten
   una sola versión trazable.
3. **`LABEL` OCI** con `version`, `title` y `source` para que la versión viaje dentro de la
   imagen (`docker inspect`).
4. **`docker-compose.lab.yml`** (aislado del de producción) orquesta `hc-db:1.1.0` + el
   backend, demostrando la imagen versionada en un contenedor.
5. El historial completo de migraciones permanece versionado en `db/migrations/` y en git;
   la imagen es el empaquetado reproducible de un punto de ese historial.

## Consecuencias

- **Positivas:** artefacto de BD reproducible e identificable por versión; consistencia
  dev/prod; se puede publicar en un registro como cualquier imagen; el arranque crea el
  esquema completo sin pasos manuales.
- **Negativas / límites:** al cambiar el esquema hay que **reconstruir** la imagen y subir el
  tag (p. ej. `hc-db:1.2.0`); los scripts de `initdb.d` solo corren con el volumen de datos
  vacío (primer arranque), por lo que actualizar una BD existente sigue requiriendo migración.
- **Control de versiones:** un nuevo cambio de esquema = nueva migración en `db/migrations/`
  - nuevo tag de imagen, ambos bajo el mismo número de versión.

## Referencias

- ADR-0028 (rotación de refresh tokens — migración 006).
- ADR-0040 (baseline v1.1.0 firmada).
