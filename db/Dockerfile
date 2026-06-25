# ============================================================
#  hc-db — Imagen versionada de la base de datos (hc-odontologia)
#
#  Empaqueta el ESQUEMA CANÓNICO + las migraciones dentro de la imagen, de modo
#  que `docker run` levante una base de datos lista y reproducible, idéntica en
#  desarrollo y producción. El tag de la imagen corresponde a la LÍNEA BASE del
#  proyecto (v1.1.0), enlazando el control de versiones del esquema con el de la
#  imagen.
#
#  Construir (desde la carpeta db/):
#     docker build -t hc-db:1.1.0 .
#  Ejecutar:
#     docker run -d --name hc-db -e MYSQL_ROOT_PASSWORD=root_password \
#       -p 3306:3306 hc-db:1.1.0
#
#  Versión del esquema:
#     000_init.sql        → esquema canónico (incorpora migraciones 001-005)
#     006_refresh_token   → última migración aplicada encima (ADR-0028)
#  El historial completo de migraciones está versionado en db/migrations/.
# ============================================================
FROM mysql:8.0

LABEL org.opencontainers.image.title="hc-db" \
      org.opencontainers.image.version="1.1.0" \
      org.opencontainers.image.description="Base de datos hc-odontologia: esquema canónico + migraciones (línea base v1.1.0)" \
      org.opencontainers.image.source="https://github.com/Edstone5/hc-backend"

# La base de datos por defecto del esquema.
ENV MYSQL_DATABASE=hc_db

# Los scripts de /docker-entrypoint-initdb.d se ejecutan en orden alfabético en
# el PRIMER arranque del contenedor (cuando el volumen de datos está vacío).
#   000 = esquema base canónico (ya incluye las migraciones 001-005)
#   006 = migración de refresh tokens (rotación/revocación, ADR-0028)
COPY init.sql                          /docker-entrypoint-initdb.d/000_init.sql
COPY migrations/006_refresh_token.sql  /docker-entrypoint-initdb.d/006_refresh_token.sql

EXPOSE 3306
