# Git Flow — Guía de Trabajo

**Proyecto**: Sistema de Historia Clínica — UNJBG

---

## Setup inicial (una vez por desarrollador)

```bash
# Configurar la plantilla de commit
git config commit.template .gitmessage

# Verificar ramas remotas disponibles
git fetch origin
git branch -a
```

---

## Flujo de trabajo diario

### 1. Nueva funcionalidad

```bash
# Siempre parte de develop actualizado
git checkout develop
git pull origin develop

# Crear rama con nombre descriptivo
git checkout -b feature/HC-42-agregar-endpoint-evolucion

# ... desarrollar + tests ...

# Commit siguiendo la plantilla
git add src/...
git commit   # abre .gitmessage como plantilla

# Push y abrir PR a develop en GitHub
git push -u origin feature/HC-42-agregar-endpoint-evolucion
```

### 2. Corrección de bug

```bash
git checkout develop && git pull
git checkout -b fix/HC-55-error-uuid-filiacion
# ... fix + test ...
git commit
git push -u origin fix/HC-55-error-uuid-filiacion
# PR a develop
```

### 3. Hotfix en producción (urgente)

```bash
git checkout main && git pull
git checkout -b hotfix/HC-99-crash-login

# ... fix mínimo + test ...
git commit

# PR a main Y a develop
git push -u origin hotfix/HC-99-crash-login
```

### 4. Release

```bash
git checkout develop && git pull
git checkout -b release/v2.1.0

# Bumper de versión
npm version minor --no-git-tag-version
# Actualizar CHANGELOG.md

git commit -m "chore(release): preparar v2.1.0"
git push -u origin release/v2.1.0
# PR a main → merge → tag automático en CI

# Merge de vuelta a develop
git checkout develop
git merge release/v2.1.0
git push origin develop
```

---

## Reglas de Naming

| Tipo    | Formato                                  | Ejemplo                              |
| ------- | ---------------------------------------- | ------------------------------------ |
| Feature | `feature/HC-{issue}-{kebab-descripcion}` | `feature/HC-10-healthcheck-endpoint` |
| Fix     | `fix/HC-{issue}-{kebab-descripcion}`     | `fix/HC-20-jwt-expiry`               |
| Hotfix  | `hotfix/HC-{issue}-{kebab-descripcion}`  | `hotfix/HC-99-crash-login`           |
| Release | `release/v{MAJOR}.{MINOR}.{PATCH}`       | `release/v2.1.0`                     |
| Docs    | `docs/HC-{issue}-{kebab-descripcion}`    | `docs/HC-30-sad-document`            |

---

## Política de Pull Requests

1. **Título del PR**: igual formato que el commit (`feat(scope): descripción`)
2. **Descripción**: qué cambió, por qué, cómo probarlo
3. **Checks obligatorios**: CI verde + cobertura ≥ 80%
4. **Aprobaciones**: mínimo 1 reviewer
5. **Merge strategy**: Squash merge a `develop`, Merge commit a `main`

---

## Comandos útiles

```bash
# Ver log con graph de ramas
git log --oneline --graph --all --decorate

# Verificar que el commit sigue Conventional Commits
# (si está configurado el hook commitlint)
git log --oneline -5

# Sincronizar develop local
git fetch origin && git rebase origin/develop
```
