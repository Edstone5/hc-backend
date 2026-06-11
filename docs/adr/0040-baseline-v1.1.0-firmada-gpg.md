# ADR-0040: Baseline v1.1.0 firmada criptográficamente (GPG) y bitácora de configuración

- **Estado:** Aceptada
- **Fecha:** 2026-06-11
- **Contexto:** Gestión de Configuración (SCM) — primer punto de control del MVP

## Contexto

El proyecto alcanzó un estado estable y auditado del MVP v1.1 (odontograma NTS-188
completo y validado, validación docente con roles, 1468 pruebas backend y 136 frontend
en verde). La práctica de SCM exige formalizar la primera **línea base (baseline)**
mediante un tag de Git **firmado criptográficamente**, de modo que el punto de control
sea íntegro (no alterable sin invalidar la firma) y atribuible (se sabe quién lo declaró).

Hasta ahora el repositorio no contaba con tags ni con firma GPG configurada.

## Decisión

1. Declarar la baseline **`v1.1.0`** ("Baseline Producto 1 — MVP v1.1") como tag
   **anotado y firmado** (`git tag -s`) sobre el commit estable de la rama
   `feature/odontograma-nts150`, en **ambos** repositorios (`hc-backend` `39ff065`,
   `hc-frontend` `6cc1d8e`), y publicarla en los remotos.
2. Generar una clave **ed25519** (firmado, expira 2028-06-10) para el responsable de SCM:
   - Titular: Edson F. Condemaita Velasquez `<edsoncondemaita@gmail.com>`
   - Fingerprint: `ACCD F79E 8DDB C08E 56F8 E498 4B1B CC08 A030 2517`
3. Versionar la **clave pública** en la documentación oficial del proyecto:
   `docs/gpg/edson-condemaita-pub-4B1BCC08A0302517.asc`, para que cualquier auditor
   pueda verificar la firma con `gpg --import` + `git tag -v v1.1.0`.
4. Abrir la **bitácora de configuración** `docs/BASELINE.md` con el registro de la
   baseline, el procedimiento de verificación y la sección de **Deuda SCM** (secretos
   gestionados fuera de Git: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`).

## Consecuencias

- Existe un punto de restauración/auditoría inmutable y verificable del MVP v1.1.
- Todo cambio posterior a la baseline queda sujeto a control de cambios formal
  (rama feature + ADR + conventional commit + pruebas en verde).
- Los secretos siguen **fuera** del repositorio; su consistencia se asegura con la
  plantilla `.env.example`, la guía `SETUP.md` y la entrega por canal privado del
  equipo (registrado como deuda SCM en `docs/BASELINE.md`).
- La verificación de la firma requiere importar la clave pública versionada; si la
  clave expira (2028) deberá renovarse y re-publicarse (`docs/gpg/`).
