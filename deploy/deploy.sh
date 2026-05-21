#!/usr/bin/env bash
# Deploy production stack — DB volume giữ nguyên qua mọi lần git pull / image update
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_COMPOSE="${DEPLOY_COMPOSE_ENV:-$ROOT/deploy/env/compose.env}"

if [[ ! -f "$ENV_COMPOSE" ]]; then
  echo "Thiếu $ENV_COMPOSE — chạy: cp deploy/env/compose.env.example deploy/env/compose.env"
  exit 1
fi
if [[ ! -f "$ROOT/deploy/env/backend.env" ]]; then
  echo "Thiếu deploy/env/backend.env — chạy: cp deploy/env/backend.env.example deploy/env/backend.env"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_COMPOSE"
set +a

compose() {
  if docker compose version &>/dev/null 2>&1; then
    docker compose --env-file "$ENV_COMPOSE" -f "$COMPOSE_FILE" "$@"
  else
    docker-compose -f "$COMPOSE_FILE" "$@"
  fi
}

TARGET="${1:-all}"

pull_and_up() {
  local svc="$1"
  echo "==> pull $svc"
  compose pull "$svc"
  echo "==> up -d $svc"
  compose up -d --no-build "$svc"
}

case "$TARGET" in
  all)
    compose pull
    compose up -d --no-build
    ;;
  backend)
    pull_and_up backend
    ;;
  frontend)
    pull_and_up frontend
    ;;
  mysql)
    pull_and_up mysql
    ;;
  *)
    echo "Usage: $0 [all|backend|frontend|mysql]"
    exit 1
    ;;
esac

compose ps
echo "Health: curl -sS http://127.0.0.1/e-master/health"
