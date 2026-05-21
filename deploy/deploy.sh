#!/usr/bin/env bash
# Deploy production stack — DB volume giữ nguyên qua mọi lần git pull / image update
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_COMPOSE="${DEPLOY_COMPOSE_ENV:-$ROOT/deploy/env/compose.env}"

MYSQL_C=emaster-mysql
BACKEND_C=emaster-backend
FRONTEND_C=emaster-frontend

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

if [[ "${DOCKER_REGISTRY:-}" == *"YOUR_GITHUB_USER"* ]] || [[ -z "${DOCKER_REGISTRY:-}" ]]; then
  echo "Lỗi: sửa DOCKER_REGISTRY trong $ENV_COMPOSE"
  echo "  Ví dụ: DOCKER_REGISTRY=ghcr.io/minhnguyet181"
  exit 1
fi

compose() {
  if docker compose version &>/dev/null 2>&1; then
    docker compose --env-file "$ENV_COMPOSE" -f "$COMPOSE_FILE" "$@"
  else
    docker-compose --env-file "$ENV_COMPOSE" -f "$COMPOSE_FILE" "$@"
  fi
}

# Container cũ tạo bởi compose project khác (vd. e-master-website) — `down` không xóa được
remove_container_by_name() {
  local name="$1"
  if docker inspect "$name" &>/dev/null 2>&1; then
    echo "==> gỡ container cũ (giữ volume DB): $name"
    docker rm -f "$name" >/dev/null
  fi
}

cleanup_containers() {
  local -a names=("$@")
  for name in "${names[@]}"; do
    remove_container_by_name "$name"
  done
}

TARGET="${1:-all}"

pull_and_up() {
  local svc="$1"
  local cname
  case "$svc" in
    mysql) cname=$MYSQL_C ;;
    backend) cname=$BACKEND_C ;;
    frontend) cname=$FRONTEND_C ;;
    *) echo "Unknown service: $svc"; exit 1 ;;
  esac
  cleanup_containers "$cname"
  echo "==> pull $svc"
  compose pull "$svc"
  echo "==> up -d $svc"
  compose up -d --no-build --remove-orphans "$svc"
}

case "$TARGET" in
  down)
    compose down --remove-orphans 2>/dev/null || true
    cleanup_containers "$MYSQL_C" "$BACKEND_C" "$FRONTEND_C"
    echo "Đã dừng stack (volume emaster_mysql_data vẫn giữ)."
    exit 0
    ;;
  all)
    compose down --remove-orphans 2>/dev/null || true
    cleanup_containers "$MYSQL_C" "$BACKEND_C" "$FRONTEND_C"
    compose pull
    compose up -d --no-build --remove-orphans
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
    echo "Usage: $0 [all|down|backend|frontend|mysql]"
    exit 1
    ;;
esac

compose ps
echo "Health: curl -sS http://127.0.0.1:${HTTP_PORT:-8080}/e-master/health"
