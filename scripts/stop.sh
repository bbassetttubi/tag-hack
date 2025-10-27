#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"

function kill_pid_file() {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid=$(cat "$pid_file")
    if ps -p "$pid" >/dev/null 2>&1; then
      echo "[stop] Terminating $name (pid $pid)..."
      kill "$pid" || true
    fi
    rm -f "$pid_file"
  fi
}

kill_pid_file "frontend"
kill_pid_file "backend"

while read -r pid; do
  if [[ -n "$pid" ]]; then
    echo "[stop] Forcing process $pid to exit..."
    kill "$pid" || true
  fi
done < <(lsof -ti :4000 -ti :9464 -ti :8081 -ti :8082 | sort -u)

echo "[stop] Services stopped."

