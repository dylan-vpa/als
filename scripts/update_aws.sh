#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BRANCH="${BRANCH:-main}"
GIT_PULL_MODE="${GIT_PULL_MODE:-ff-only}" # ff-only|reset
BACK_DIR="$REPO_DIR/back"
FRONT_DIR="$REPO_DIR/front"

cd "$REPO_DIR"
echo "[update] repo: $REPO_DIR branch: $BRANCH mode: $GIT_PULL_MODE"
git fetch --all --prune
git checkout "$BRANCH"
if [ "$GIT_PULL_MODE" = "reset" ]; then
  echo "[update] forcing to origin/$BRANCH with hard reset"
  git reset --hard "origin/$BRANCH"
else
  echo "[update] git pull --ff-only"
  git pull --ff-only
fi

if [ -d "$BACK_DIR" ]; then
  PYTHON_BIN="${PYTHON_BIN:-python3}"
  VENV_DIR="${VENV_DIR:-$BACK_DIR/venv}"
  if [ ! -d "$VENV_DIR" ]; then
    "$PYTHON_BIN" -m venv "$VENV_DIR"
  fi
  "$VENV_DIR/bin/pip" install --upgrade pip
  if [ -f "$BACK_DIR/requirements.txt" ]; then
    "$VENV_DIR/bin/pip" install -r "$BACK_DIR/requirements.txt"
  fi
fi

if [ -d "$FRONT_DIR" ]; then
  cd "$FRONT_DIR"
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  npm run build
  cd "$REPO_DIR"
fi

BACK_SERVICE="${BACK_SERVICE:-als-back.service}"
NGROK_SERVICE="${NGROK_SERVICE:-ngrok.service}"
FRONT_SERVICE="${FRONT_SERVICE:-}"

if command -v systemctl >/dev/null 2>&1; then
  if [ -n "$BACK_SERVICE" ]; then
    sudo systemctl restart "$BACK_SERVICE"
    sudo systemctl status "$BACK_SERVICE" --no-pager -n 5 || true
  fi
  if [ -n "$FRONT_SERVICE" ]; then
    sudo systemctl restart "$FRONT_SERVICE"
    sudo systemctl status "$FRONT_SERVICE" --no-pager -n 5 || true
  fi
  if [ -n "$NGROK_SERVICE" ]; then
    sudo systemctl restart "$NGROK_SERVICE"
    sudo systemctl status "$NGROK_SERVICE" --no-pager -n 5 || true
  fi
fi

echo "Actualización completada"