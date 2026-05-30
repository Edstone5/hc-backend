# Guía de Actividades No Programables del Sílabo IS II 2026-I

Este documento cubre las actividades del sílabo que **no se traducen directamente
en código**, pero que son evaluables. Para cada una se da orientación sobre cómo
presentarlas y qué herramientas usar.

---

## Semana 1-2: Event Storming y Context Map

### Event Storming (taller de 2-3h)

**Herramienta recomendada**: Miro (gratuito para equipos pequeños)  
**URL**: https://miro.com

**Qué incluir en el tablero**:

```
EVENTOS DE DOMINIO (naranja):
  HistoriaClinicaCreada → PacienteAsignado → FiliacionRegistrada
  AntecedentesRegistrados → ExamenesRegistrados → DiagnosticoPresuntivo
  RevisionSolicitada → RevisionAprobada → EvolucionRegistrada

COMANDOS (azul):
  CrearHistoriaClinica ← IniciarConsulta ← AsignarPaciente
  RegistrarFiliacion ← RegistrarAntecedentes ← etc.

ACTORES (amarillo):
  Estudiante de odontología / Docente / Administrador

AGREGADOS (celeste):
  HistoriaClinica / Paciente / Usuario
  ExamenFisico / Diagnostico / Evolucion
```

**Entregable**: Captura de pantalla del tablero + link compartido

---

### Context Map (DDD)

**Herramienta**: Lucidchart, draw.io o Miro

**Contextos acotados del sistema HC-UNJBG**:

```
┌─────────────────────┐    ┌─────────────────────┐
│  Contexto de         │    │  Contexto de         │
│  Identidad y Acceso │    │  Historia Clínica    │
│  (auth, user)       │◄──►│  (hc, filiacion,     │
│                     │    │   antecedente, etc.) │
└─────────────────────┘    └──────────┬──────────┘
                                      │ upstream
                           ┌──────────▼──────────┐
                           │  Contexto de         │
                           │  Catálogos Clínicos  │
                           │  (catalogo)          │
                           └─────────────────────┘
```

**Patrón**: Shared Kernel entre "Identidad" e "Historia Clínica"  
(el `id_usuario` del `usuario` es referenciado por varias entidades de HC)

---

## Semana 3-4: Modelo de Dominio Rico

El modelo rico ya está implementado en el código. Para el entregable de documentación:

1. **Diagrama de clases de dominio** (UML simplificado):
   - Mostrar `*Aggregate`, `*ValueObject`, `I*Repository`
   - Solo los campos más importantes (no getters triviales)
   - Herramienta: PlantUML o draw.io

2. **Comparación Modelo Anémico vs Rico**:
   - Antes: `filiacion.id_historia = uuid` (validación en controller)
   - Después: `new IdHistoriaClinicaVO(uuid)` (validación en dominio)
   - Ver `docs/GLOSARIO_LENGUAJE_UBICUO.md` para el vocabulario

---

## Semana 7: Retrospectiva del Sprint

**Formato sugerido** (4L):

- **Liked** (qué salió bien): tests 93%, hexagonal completado
- **Lacked** (qué faltó): mayor cobertura de ramas (89%)
- **Learned** (qué aprendimos): `vi.hoisted()` necesario para mocks con TDZ
- **Longed for** (qué necesitamos): más tiempo para BDD en capa de aplicación

---

## Semana 8: Presentación del Producto 1 (MVP v1.1)

**Checklist de entregables**:

- [ ] Repositorio GitHub con código hexagonal
- [ ] Tests pasando: `npm run test:ci` → 93% cobertura
- [ ] BDD: `npm run test:bdd` → 91 escenarios
- [ ] `docs/` con SAD, ADRs, glosario
- [ ] Demo en vivo del API con Swagger UI (`/api/api-docs`)

---

## Semana 10: Estrategia de Branching (presentación)

**Script para la presentación**:

```bash
# Mostrar la estructura de ramas actual
git log --oneline --graph --all --decorate | head -20

# Mostrar el hook de commit en acción
git commit -m "feat: nuevo endpoint"         # ✅ pasa
git commit -m "agregando un nuevo endpoint"  # ❌ falla → commitlint
```

**Diagrama para la presentación** (`docs/GIT_FLOW.md` ya lo tiene):

```
main  ◄── PRs aprobados + CI verde
  └── develop ◄── features integradas
        ├── feature/HC-N-descripcion
        ├── fix/HC-N-descripcion
        └── hotfix/HC-N-descripcion → main + develop
```

---

## Semana 12: Auditoría SCM (IEEE 828)

**Proceso de auditoría para el entregable**:

### Auditoría Funcional (FCA) — ejecutar antes de cerrar la baseline v2.0.0

```bash
# 1. Todos los tests pasan
npm run test:ci
# Resultado esperado: 1282 passed, 93.34% cobertura

# 2. BDD pasa
npm run test:bdd
# Resultado esperado: 91 scenarios passed

# 3. Swagger responde
curl http://localhost:3000/api/api-docs/swagger.json | head -5

# 4. /health responde 200
curl -s http://localhost:3000/health | python3 -m json.tool

# 5. /metrics devuelve texto Prometheus
curl -s http://localhost:3000/metrics | head -5
```

### Auditoría Física (PCA) — verificar consistencia

```bash
# ¿La versión en package.json coincide con el tag git?
node -p "require('./package.json').version"     # → 2.0.0
git tag | tail -1                                # → v2.0.0

# ¿.env.example tiene todas las variables que usa el código?
grep "process.env\." db/db.js                   # → DB_HOST, DB_USER...
cat .env.example                                # → debe tenerlas todas

# ¿Hay secretos en el código?
git log --all --full-history -- "**/.env" | head -5
# No debe mostrar nada (no hay .env en el historial)
```

---

## Semana 14: SRE — Demo del Dashboard

**Pasos para la demo**:

```bash
# Levantar todo el stack
docker-compose up -d

# Esperar que pase el healthcheck (~30s)
docker-compose ps

# Generar tráfico de prueba
for i in $(seq 1 20); do
  curl -s http://localhost:3000/health > /dev/null
  curl -s http://localhost:3000/api/catalogo/catalogo_sexo > /dev/null
done

# Abrir Grafana
# URL: http://localhost:3001
# Login: admin / admin
# Dashboard: HC Backend — SRE Dashboard
```

**SLOs a mostrar en la demo**:

- Tasa de error: 0% (ninguna petición fallida)
- P95 Latencia: < 50ms en desarrollo local
- Heap Node.js: < 100MB
- Ver `docs/SLO.md` para los objetivos de producción

---

## Semana 16: Presentación del Producto 2 (v2.0)

**Narrative para la presentación** (5 min):

1. **Arquitectura** (1 min): Mostrar diagrama C4 del `docs/SAD.md`
2. **SCM** (1 min): Pipeline CI/CD corriendo en GitHub Actions
3. **SRE** (1 min): Dashboard Grafana con métricas reales
4. **Tests** (1 min): `npm run test:ci` → 93%, `npm run test:bdd` → 91 escenarios
5. **Deploy** (1 min): Imagen Docker en GHCR + `docker-compose up --build`

**Artefactos a presentar**:

- [ ] `docs/SCM_PLAN.md` — Plan IEEE 828
- [ ] `.github/workflows/ci.yml` — Pipeline completo (6 jobs)
- [ ] Grafana dashboard captura de pantalla
- [ ] `docs/SLO.md` — 8 SLOs definidos
- [ ] `docs/SAD.md` — Vistas C4 + 4 ADRs
- [ ] Swagger UI con todos los endpoints documentados

---

_Documento complementario al código — actualizar con cada entrega parcial._
