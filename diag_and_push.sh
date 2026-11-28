#!/usr/bin/env bash
set -euo pipefail

# Point de rupture evite :
# 1) Push GitHub suppose effectue alors que le code retour est 128 -> verification explicite de chaque commande et exit code
# 2) Fichiers index.html ou modules/caisse.js non commites -> verification de l'arbre de travail et commit propre avant push
# 3) Gel du terminal Termux sur prompt d'authentification -> GIT_TERMINAL_PROMPT=0 + timeout strict 10s/15s
# Module alimente : alimente origin/main (Bombele/cheer-tec-protocol) pour index.html et modules/caisse.js

REPO_DIR="${1:-/data/data/com.termux/files/home/cheer-tec-protocol}"
BRANCH_NAME="${2:-main}"

cd "${REPO_DIR}"
export GIT_TERMINAL_PROMPT=0
export GCM_INTERACTIVE=never

echo "=== 1. Verification fichiers locaux ==="
for f in "index.html" "modules/caisse.js"; do
  if [ -s "${f}" ]; then
    echo "OK : ${f} ($(wc -c < "${f}") octets)"
  else
    echo "MANQUANT OU VIDE : ${f}" >&2
  fi
done

echo "=== 2. Indexation et commit si necessaire ==="
rm -f *.tmp.* 2>/dev/null || true
timeout 10s git add -A -- ':!*.bak.*' ':!*.tmp.*'
if ! git diff --cached --quiet; then
  timeout 10s git commit -m "chore(pos): sync index shell and caisse point-zero module"
else
  echo "Aucun changement nouveau a commiter."
fi

echo "=== 3. Etat des commits locaux vs origin/${BRANCH_NAME} ==="
timeout 15s git fetch origin "${BRANCH_NAME}" || true
timeout 10s git status -sb
timeout 10s git log -n 2 --oneline || true

echo "=== 4. Test push non interactif ==="
if timeout 15s git push -u origin "${BRANCH_NAME}"; then
  echo "SUCCES : synchronisation GitHub confirmee sur origin/${BRANCH_NAME}."
else
  RC=$?
  echo "ECHEC PUSH (code ${RC}) : GitHub n'a pas recu les modifications." >&2
  echo "Pour enregistrer ton token PAT GitHub (scope repo) :" >&2
  echo "  printf 'https://Bombele:TON_PAT_GITHUB@github.com\n' > ~/.git-credentials && chmod 600 ~/.git-credentials" >&2
  echo "Puis relance : ./diag_and_push.sh" >&2
  exit "${RC}"
fi
