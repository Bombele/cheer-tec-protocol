#!/usr/bin/env bash
set -euo pipefail

# Point de rupture evite :
# 1) git push attend un mot de passe/token sur /dev/tty ou askpass dans Termux -> GIT_TERMINAL_PROMPT=0 + test non interactif avec timeout 10s
# 2) Credential helper ou ssh/https bloquant sans TTY -> detection claire du mode d'authentification et echec rapide (< 10s) sans gel du terminal
# 3) Blocage reseau ou TLS -> timeout 10s et diagnostic immediat
# Module alimente : fiabilise le push de sync_github.sh vers origin/main pour Bombele/cheer-tec-protocol

REPO_DIR="${1:-/data/data/com.termux/files/home/cheer-tec-protocol}"
BRANCH_NAME="${2:-main}"

cd "${REPO_DIR}"

export GIT_TERMINAL_PROMPT=0
export GCM_INTERACTIVE=never

echo "Verification non interactive vers origin/${BRANCH_NAME} (timeout 10s)..."

if timeout 10s git push --dry-run origin "${BRANCH_NAME}" >/dev/null 2>&1; then
  echo "Authentification Git HTTPS/SSH validee en mode non interactif."
  timeout 15s git push -u origin "${BRANCH_NAME}"
  echo "Push termine vers origin/${BRANCH_NAME}."
else
  echo "Echec ou absence d'identifiants non interactifs (code sortie : $?). Aucun blocage terminal." >&2
  echo "Options concretes :" >&2
  echo "1) Enregistrer le PAT une fois dans ~/.git-credentials :" >&2
  echo "   printf 'https://Bombele:TON_PAT_GITHUB@github.com\n' > ~/.git-credentials && chmod 600 ~/.git-credentials" >&2
  echo "2) Ou basculer origin en SSH si une cle ~/.ssh/id_ed25519 existe :" >&2
  echo "   git remote set-url origin git@github.com:Bombele/cheer-tec-protocol.git" >&2
  exit 1
fi
