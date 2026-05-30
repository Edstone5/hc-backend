# ADR-0005: Estrategia de Despliegue GitOps

**Estado**: Aceptado  
**Fecha**: 2026-05  
**Autores**: Equipo HC-UNJBG

---

## Contexto y problema

El sílabo exige "GitOps" en el Producto 2 (Semana 16). Antes de esta decisión el
pipeline solo construía y publicaba la imagen Docker en GHCR, pero **no desplegaba
automáticamente** en el servidor. Un operador tenía que entrar al VPS y ejecutar
`docker-compose pull && docker-compose up -d` manualmente.

Esto viola el principio GitOps más importante: **el estado del servidor debe
converger automáticamente al estado declarado en Git, sin intervención humana**.

---

## ¿Qué diferencia CI/CD de GitOps?

```
CI/CD tradicional (orientado a tareas — PUSH):
  git push → pipeline construye → pipeline EMPUJA al servidor
  Problema: el pipeline es quien controla el servidor.
  Si el pipeline falla a mitad, el sistema queda inconsistente.

GitOps (orientado a estado — PULL):
  git push → imagen publicada en registro → agente en servidor JALA
  Ventaja: el servidor siempre intenta alcanzar el estado de Git.
  Si el agente falla, lo reintenta. El estado es eventualmente consistente.
```

Los 4 principios de OpenGitOps aplicados a este proyecto:

| Principio                   | Implementación                                           |
| --------------------------- | -------------------------------------------------------- |
| **Declarativo**             | `docker-compose.yml` describe el estado deseado completo |
| **Versionado**              | `docker-compose.yml` vive en Git con historial completo  |
| **Pull automático**         | Watchtower jala nuevas imágenes de GHCR sin intervención |
| **Reconciliación continua** | Watchtower verifica cada 30s si hay imagen más nueva     |

---

## Decisión: GitOps con Docker Compose + Watchtower + GitHub Actions

### Componentes

```
Desarrollador
    │
    └── git push a main
              │
              ▼
    GitHub Actions (CI)
    ├── Job 1: tests + coverage ≥ 80%
    ├── Job 2: lint + commitlint
    ├── Job 3: integration test (MySQL)
    ├── Job 4: BDD Cucumber
    └── Job 6: build + push imagen → ghcr.io/org/hc-backend:latest
                                              │
                                    (GHCR Registry)
                                              │
                                    ← Watchtower (en el VPS)
                                      jala cada 30s
                                      si imagen:latest cambió →
                                      docker pull + restart automático
```

### ¿Por qué Watchtower?

- Es un agente que corre **dentro** del servidor como contenedor Docker
- Cada N segundos consulta el registro de imágenes (GHCR)
- Si detecta una imagen más nueva que la que está corriendo, la descarga
  y reinicia el contenedor con zero-downtime (si está configurado)
- El desarrollador nunca toca el servidor: solo hace `git push`

### ¿Por qué también el job SSH?

El job SSH en GitHub Actions es el "empujón inicial" y el rollback manual.
Watchtower se ocupa de los deploys cotidianos, pero para un rollback inmediato
(`git revert + push`) o el primer deploy, el operador puede ejecutar el job
manualmente desde GitHub Actions.

---

## Consecuencias

**Positivas**:

- Un `git push a main` es suficiente para desplegar en producción
- Rollback = `git revert` + `git push` (en segundos)
- El servidor nunca depende de que un humano ejecute comandos
- El `docker-compose.yml` es la única fuente de verdad del sistema
- Compatible con VPS bare-metal (no requiere Kubernetes)

**Negativas**:

- Watchtower necesita credenciales del registro de imágenes en el servidor
- La latencia de deploy es ~30s (tiempo de polling de Watchtower)
- Para Kubernetes nativo se necesitaría Argo CD o Flux (fuera de alcance)

---

## Referencias

- [Watchtower](https://containrrr.dev/watchtower/)
- [OpenGitOps Principles](https://opengitops.dev/)
- [GitOps vs CI/CD — Weaveworks](https://www.weave.works/blog/gitops-operations-by-pull-request)
