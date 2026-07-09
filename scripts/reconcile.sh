#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# reconcile.sh — Agente GitOps local (alternativa ligera a Watchtower)
#
# PROPÓSITO:
#   Implementa el principio GitOps de "reconciliación continua" sin necesidad
#   de Watchtower ni Kubernetes. Corre como systemd timer o cron en el VPS.
#
# QUÉ HACE:
#   1. Compara el último commit de origin/main con el commit local
#   2. Si hay divergencia → git pull + docker-compose up (reconcilia el estado)
#   3. Verifica /health después de cada actualización
#   4. Si /health falla → git revert automático (rollback)
#   5. Registra todo en /var/log/hc-reconcile.log
#
# USO:
#   # Instalar como cron job (cada 5 minutos):
#   echo "*/5 * * * * /srv/hc-backend/scripts/reconcile.sh" | crontab -
#
#   # O como systemd timer:
#   cp scripts/hc-reconcile.service /etc/systemd/system/
#   systemctl enable --now hc-reconcile.timer
#
# VARIABLES DE ENTORNO (poner en /etc/environment o .env del servidor):
#   HC_DIR=/srv/hc-backend       # directorio del proyecto
#   HC_BRANCH=main               # rama a seguir
#   GHCR_TOKEN=ghp_xxx           # token para docker login a GHCR
#   GHCR_USER=Edstone5           # usuario de GitHub
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

HC_DIR="${HC_DIR:-/srv/hc-backend}"
HC_BRANCH="${HC_BRANCH:-main}"
LOG="/var/log/hc-reconcile.log"
HEALTH_URL="http://localhost:3000/health"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

cd "$HC_DIR"

# ── 1. Obtener estado remoto ──────────────────────────────────────────────────
git fetch origin "$HC_BRANCH" --quiet

LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse "origin/$HC_BRANCH")

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  log "OK — sin cambios (SHA: ${LOCAL_SHA:0:8})"
  exit 0
fi

log "CAMBIO DETECTADO: ${LOCAL_SHA:0:8} → ${REMOTE_SHA:0:8}"

# ── 2. Guardar SHA anterior para posible rollback ─────────────────────────────
PREVIOUS_SHA="$LOCAL_SHA"

# ── 3. Sincronizar con Git (fuente de verdad) ─────────────────────────────────
log "Sincronizando con Git..."
git reset --hard "origin/$HC_BRANCH"

# ── 4. Actualizar imagen Docker si hay credenciales GHCR ─────────────────────
if [ -n "${GHCR_TOKEN:-}" ]; then
  log "Actualizando imagen desde GHCR..."
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-}" --password-stdin --quiet
  BACKEND_IMAGE="ghcr.io/${GHCR_USER:-}/hc-backend:latest" \
    docker compose pull backend --quiet
fi

# ── 5. Aplicar el nuevo estado (reconciliar) ──────────────────────────────────
log "Aplicando nuevo estado con docker-compose..."
BACKEND_IMAGE="${BACKEND_IMAGE:-hc_backend_local}" \
  docker compose --profile prod up -d --remove-orphans --quiet-pull

# ── 6. Verificar que el sistema está sano ─────────────────────────────────────
log "Esperando 15s para que el backend arranque..."
sleep 15

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  log "✅ RECONCILIADO OK — SHA: ${REMOTE_SHA:0:8}, /health: 200"
  docker image prune -f --filter "label=gitops=hc-backend" >> "$LOG" 2>&1
  exit 0
fi

# ── 7. ROLLBACK automático si /health no responde ─────────────────────────────
log "❌ ERROR: /health devolvió $HTTP_STATUS — iniciando rollback a $PREVIOUS_SHA"
git reset --hard "$PREVIOUS_SHA"

BACKEND_IMAGE="${BACKEND_IMAGE:-hc_backend_local}" \
  docker compose --profile prod up -d --quiet-pull

sleep 15
ROLLBACK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$ROLLBACK_STATUS" = "200" ]; then
  log "✅ ROLLBACK exitoso — SHA anterior restaurado: ${PREVIOUS_SHA:0:8}"
else
  log "🚨 CRÍTICO: Rollback también falló. Intervención manual requerida."
  exit 2
fi
