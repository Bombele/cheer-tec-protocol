#!/usr/bin/env bash
set -euo pipefail

# Point de rupture evite :
# 1) Saisie manuelle bloquante du nom d'utilisateur et du token a chaque push -> cache credential store local ou URL avec utilisateur
# 2) Commande reseau suspendue sur Termux -> timeout strict de 15s sur git remote et git push
# 3) Mot de passe compte GitHub tape a la place d'un PAT (Personal Access Token) -> rappel explicite d'utiliser un PAT (ghp_...)
# Module alimente : alimente sync_github.sh (push non interactif vers origin/main)

REPO_DIR="${1:-/data/data/com.termux/files/home/cheer-tec-protocol}"
GITHUB_USER="${2:-Bombele}"

cd "${REPO_DIR}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Erreur : ${REPO_DIR} n'est pas un depot Git valide." >&2
  exit 1
fi

timeout 10s git config --local credential.helper store
timeout 10s git config --local user.name "${GITHUB_USER}"

if [ -z "$(timeout 10s git config --local user.email || true)" ]; then
  timeout 10s git config --local user.email "cbltec@proton.me"
fi

timeout 10s git remote set-url origin "https://${GITHUB_USER}@github.com/${GITHUB_USER}/cheer-tec-protocol.git"

echo "Configuration credential store activee pour l'utilisateur : ${GITHUB_USER}"
echo "Au prochain push, entre ton Personal Access Token (PAT) GitHub (pas le mot de passe du compte) lorsqu'un prompt apparait ; il sera ensuite memorise."
