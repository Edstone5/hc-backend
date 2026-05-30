# Migraciones del odontograma NTS N° 150

Cambios de BD de los Bloques 1-5 (odontograma inicial/evolutivo, catálogo de
hallazgos, IHO-S, EPB).

## Forma recomendada — runner único (idempotente, dual MySQL/PostgreSQL)

```bash
# Lee DATABASE_URL del entorno (igual que el resto del backend).
npm run db:migrate
```

`db/migrate.js`:

- Detecta el dialecto (MySQL o PostgreSQL/NeonDB) desde `DATABASE_URL`.
- Aplica las migraciones **002 → 005** en orden.
- Es **idempotente**: si un objeto ya existe, lo omite (`⏭️`) en vez de fallar,
  por lo que puede re-ejecutarse sin riesgo. Si la BD ya se creó con el
  `init.sql` actualizado, no hará nada.
- Aborta (exit 1) ante cualquier error que NO sea "ya existe".

## Forma manual — archivos .sql sueltos

Cada archivo está escrito para **MySQL 8** e incluye al final NOTAS para
adaptarlo a PostgreSQL/NeonDB:

```bash
mysql -u root -p hc_db < db/migrations/002_odontograma_tipo_y_svg.sql
mysql -u root -p hc_db < db/migrations/003_odontograma_codigo_hallazgo.sql
mysql -u root -p hc_db < db/migrations/004_iho_simplificado.sql
mysql -u root -p hc_db < db/migrations/005_examen_periodontal_basico.sql
```

## Contenido por migración

| #   | Cambio                                               | Bloque / ADR  |
| --- | ---------------------------------------------------- | ------------- |
| 001 | Tabla `consentimiento_informado`                     | RF-09         |
| 002 | `odontograma_entrada.tipo` + tabla `odontograma_svg` | B1 / ADR-0009 |
| 003 | `odontograma_entrada.codigo_hallazgo`                | B2 / ADR-0010 |
| 004 | Tabla `iho_s` (IHO-S)                                | B4 / ADR-0012 |
| 005 | Tabla `epb` (Examen Periodontal Básico)              | B5 / ADR-0013 |

> Nota: en despliegues NUEVOS, `db/init.sql` ya incluye todas estas tablas y
> columnas; el runner es solo para actualizar bases ya existentes.
