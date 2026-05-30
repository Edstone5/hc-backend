# Registros de Decisión de Arquitectura (ADR)

Este directorio contiene los **Architecture Decision Records** del proyecto
`hc-backend`, siguiendo el formato
[MADR (Markdown Architecture Decision Records)](https://adr.github.io/madr/).

Cada ADR documenta una decisión arquitectural significativa: el contexto que
la motivó, las opciones consideradas, la decisión tomada y sus consecuencias.

---

## Índice

| ID       | Título                                                         | Estado      |
| -------- | -------------------------------------------------------------- | ----------- |
| ADR-0001 | Corrección de violaciones de la capa de dominio                | Aceptado ✅ |
| ADR-0002 | Introducción de interfaces de puerto en la capa de dominio     | Aceptado ✅ |
| ADR-0003 | Migración de PostgreSQL a MySQL                                | Aceptado ✅ |
| ADR-0004 | Observabilidad con Prometheus y Grafana (prom-client)          | Aceptado ✅ |
| ADR-0005 | Estrategia de despliegue GitOps (Watchtower + SSH + reconcile) | Aceptado ✅ |

---

## Convención de nombrado

`NNNN-titulo-en-kebab-case.md`

- `NNNN` — número correlativo de 4 dígitos (0001, 0002, …)
- Estado posible: `Propuesto` → `Aceptado` → `Deprecado` / `Reemplazado por ADR-NNNN`
