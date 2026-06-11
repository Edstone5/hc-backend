# Bitácora de configuración — Baselines

Registro oficial de líneas base (baselines) del proyecto **Sistema de Historia Clínica
Odontológica** (ESIS – UNJBG). Complementa el Plan de Gestión de Configuración
(`docs/SCM_PLAN.md`) y el ADR-0040.

---

## Baseline v1.1.0 — "Baseline Producto 1 — MVP v1.1" (2026-06-11)

| Campo                | Valor                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Tag                  | `v1.1.0` (anotado y **firmado** con GPG)                                                              |
| Commit `hc-backend`  | `39ff065eef2b058c15707119fae50275ae016bbe`                                                            |
| Commit `hc-frontend` | `6cc1d8e919526aa4210268f1e40e50bde7f918d9`                                                            |
| Rama de origen       | `feature/odontograma-nts150` (ambos repos)                                                            |
| Firmante (SCM)       | Edson F. Condemaita Velasquez `<edsoncondemaita@gmail.com>`                                           |
| Clave                | ed25519 `4B1BCC08A0302517` · expira 2028-06-10                                                        |
| Fingerprint          | `ACCD F79E 8DDB C08E 56F8 E498 4B1B CC08 A030 2517`                                                   |
| Clave pública        | [`docs/gpg/edson-condemaita-pub-4B1BCC08A0302517.asc`](gpg/edson-condemaita-pub-4B1BCC08A0302517.asc) |
| Estado de calidad    | Backend: 1468 pruebas ✅ · Frontend: 136 pruebas ✅ · ESLint 0 errores                                |

### Cómo verificar la firma (cualquier auditor)

```bash
# 1) Importar la clave pública versionada en este repositorio
gpg --import docs/gpg/edson-condemaita-pub-4B1BCC08A0302517.asc

# 2) Verificar el tag
git fetch --tags
git tag -v v1.1.0
# Esperado: "Good signature from 'Edson F. Condemaita Velasquez ... '"
```

### Alcance de la baseline

Congela el MVP v1.1: odontograma conforme a NTS N° 188-MINSA/DGIESP-2022 (52 piezas,
hallazgos, exclusiones, reportes RF-12), autenticación con rotación de refresh token,
validación docente por roles (`requireRole`), y la documentación de arquitectura
(ADR 0001–0040). El inventario de Ítems de Configuración asociado a esta baseline se
mantiene en el "Registro de ICs y Baseline v0" del equipo.

---

## Deuda SCM (secretos no versionados)

Por seguridad, los siguientes ítems **no se versionan en Git** y se gestionan en
servicios/canales externos. Se registran aquí para garantizar su trazabilidad sin
comprometer el repositorio:

| Ítem                                | Dónde vive                                                   | Mecanismo de consistencia                                                                                           | Responsable |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| `DATABASE_URL` (NeonDB Postgres)    | Consola NeonDB + `.env.local` de cada dev (gitignored)       | Plantilla `.env.example` + guía `SETUP.md` §4–5; entrega por canal privado del equipo                               | Edson C.    |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | `.env.local` (gitignored) / variables del host en despliegue | Plantilla `.env.example` con instrucción de generación (`crypto.randomBytes(64)`); rotación documentada en ADR-0028 | Edson C.    |
| Credenciales de usuarios de prueba  | Sembradas en la BD compartida (`db/seed-admin.mjs`)          | Script de seed versionado (idempotente); contraseñas solo de entorno de desarrollo                                  | Edgar L.    |

**Plan de mitigación:** evaluar migración a un gestor de secretos dedicado
(p. ej. variables cifradas del proveedor de despliegue o Vault) cuando el sistema
pase a un entorno productivo real; mientras tanto, el `.env.example` actúa como
contrato de configuración y `SETUP.md` como procedimiento de distribución.

---

### Política de nuevas baselines

Una nueva baseline (`vX.Y.Z`) se declara solo cuando: (a) la NORMA DE ORO está en
verde (todas las suites + lint), (b) los cambios están documentados en ADRs, y
(c) el tag se firma con una clave cuya parte pública esté versionada en `docs/gpg/`.
