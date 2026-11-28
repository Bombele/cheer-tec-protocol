#!/usr/bin/env bash
set -euo pipefail

# Point de rupture evite :
# 1) Commande git ou reseau bloquee indefiniment -> timeout strict de 15s sur chaque operation git dist/reseau
# 2) Conflit ou divergence silencieuse sur la branche -> verification explicite de la branche, remote, rebase et etat de l'arbre
# 3) Commit accidentel de fichiers temporaires/sauvegardes (.bak, .tmp) -> exclusion explicite via .gitignore ou cible controlee
# Module alimente : synchronise le depot local (index.html, modules/caisse.js, scripts de refonte/injection) vers GitHub (Bombele/cheer-tec-protocol)

REPO_DIR="${1:-.}"
BRANCH_NAME="${2:-}"
COMMIT_MSG="${3:-chore(pos): sync index shell and caisse point-zero module}"

cd "${REPO_DIR}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Erreur : ${REPO_DIR} n'est pas un depot Git valide." >&2
  exit 1
fi

if [ -z "${BRANCH_NAME}" ]; then
  BRANCH_NAME="$(timeout 10s git rev-parse --abbrev-ref HEAD)"
fi

if [ "${BRANCH_NAME}" = "HEAD" ]; then
  echo "Erreur : HEAD detache. Specifiez une branche cible (ex: main)." >&2
  exit 1
fi

REMOTE_NAME="origin"
if ! timeout 10s git remote get-url "${REMOTE_NAME}" >/dev/null 2>&1; then
  echo "Erreur : remote '${REMOTE_NAME}' non configure." >&2
  exit 1
fi

echo "Depot : $(pwd) | Branche : ${BRANCH_NAME} | Remote : $(timeout 10s git remote get-url "${REMOTE_NAME}")"

# Nettoyage des fichiers temporaires residuels avant staging
rm -f *.tmp.* 2>/dev/null || true

# Ajout cible des fichiers applicatifs et scripts de deploiement (hors *.bak.*)
FILES_TO_STAGE=(
  "index.html"
  "modules/caisse.js"
  "refonte_index_shell.sh"
  "inject_module_caisse.sh"
)

for f in "${FILES_TO_STAGE[@]}"; do
  if [ -e "${f}" ]; then
    timeout 10s git add -- "${f}"
  fi
done

# Inclure d'eventuelles autres modifications suivies (hors *.bak.*)
timeout 10s git add -u -- ':!*.bak.*' ':!*.tmp.*'

if ! git diff --cached --quiet; then
  timeout 10s git commit -m "${COMMIT_MSG}"
  echo "Commit cree : ${COMMIT_MSG}"
else
  echo "Aucun changement indexe a commiter."
fi

echo "Recuperation distante (fetch)..."
timeout 15s git fetch "${REMOTE_NAME}" "${BRANCH_NAME}"

if timeout 15s git show-ref --verify --quiet "refs/remotes/${REMOTE_NAME}/${BRANCH_NAME}"; then
  echo "Synchronisation avec ${REMOTE_NAME}/${BRANCH_NAME} (rebase)..."
  timeout 15s git pull --rebase "${REMOTE_NAME}" "${BRANCH_NAME}"
fi

echo "Envoi vers ${REMOTE_NAME}/${BRANCH_NAME}..."
timeout 15s git push -u "${REMOTE_NAME}" "${BRANCH_NAME}"

echo "Statut final :"
timeout 10s git status -sb
