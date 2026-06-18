#!/usr/bin/env bash
# Aplica Branch Protection Rules a la rama principal de un repositorio (Lab S11).
# Requiere GitHub CLI (gh) autenticada con permiso 'repo'.
#
# Uso:
#   bash scripts/apply-branch-protection.sh <owner/repo> <rama> [checks...]
# Ejemplos:
#   bash scripts/apply-branch-protection.sh Edstone5/hc-backend testeo1
#   bash scripts/apply-branch-protection.sh Edstone5/hc-frontend main "Linter (eslint)" "Compilación (vite build)" "Unit Tests (vitest)"
#
# Ver docs/BRANCH_PROTECTION.md para el detalle de cada control.
set -euo pipefail

REPO="${1:?Falta <owner/repo>}"
BRANCH="${2:?Falta <rama>}"
shift 2 || true

# Checks por defecto = nombres de los jobs del CI del backend.
if [ "$#" -gt 0 ]; then
  CHECKS=("$@")
else
  CHECKS=("Compilación (npm ci)" "Linter (eslint)" "Unit Tests + Cobertura (vitest)" "Política de commits (commitlint)")
fi

# Construye el array JSON de contexts de status checks.
contexts_json="$(printf '%s\n' "${CHECKS[@]}" | jq -R . | jq -s .)"

echo "→ Protegiendo ${REPO}@${BRANCH} con checks: ${CHECKS[*]}"

# 1) Protección principal: PR obligatorio, checks estrictos, admins incluidos,
#    historial lineal, sin force-push ni borrado.
gh api -X PUT "repos/${REPO}/branches/${BRANCH}/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ${contexts_json} },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

# 2) Exigir commits firmados (endpoint separado en la API de GitHub).
gh api -X POST "repos/${REPO}/branches/${BRANCH}/protection/required_signatures" \
  -H "Accept: application/vnd.github+json" >/dev/null

echo "✔ Reglas aplicadas. Verifica con:"
echo "  gh api repos/${REPO}/branches/${BRANCH}/protection | jq '.required_status_checks.contexts'"
