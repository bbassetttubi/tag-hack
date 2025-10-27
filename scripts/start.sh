#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
PID_DIR="$ROOT_DIR/.pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

BACKEND_PORT=${BACKEND_PORT:-4000}
FRONTEND_PORT=${FRONTEND_PORT:-8081}

function ensure_port_free() {
  local port="$1"
  if lsof -ti ":$port" >/dev/null 2>&1; then
    echo "[start] Port $port is currently in use. Run scripts/stop.sh first or free the port manually." >&2
    exit 1
  fi
}

ensure_port_free "$BACKEND_PORT"
ensure_port_free "$FRONTEND_PORT"

touch "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log"

echo "[start] Launching backend on port $BACKEND_PORT..."
nohup bash -lc "cd '$ROOT_DIR/backend' && DISABLE_AUTH=true npm run dev" >> "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PID_DIR/backend.pid"

echo "[start] Launching Expo (frontend) on port $FRONTEND_PORT..."
nohup bash -lc "cd '$ROOT_DIR/frontend' && npx expo start --port '$FRONTEND_PORT' --ios" >> "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PID_DIR/frontend.pid"

echo "[start] Backend PID $BACKEND_PID, frontend PID $FRONTEND_PID. Press Ctrl+C to stop following logs (services keep running); use scripts/stop.sh to stop them."

tail -F "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log"

