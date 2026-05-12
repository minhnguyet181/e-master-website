#!/usr/bin/env bash
set -euo pipefail

# Minimal E2E smoke test using curl.
# Requires: BACKEND_URL, USER_EMAIL, USER_PASSWORD

BACKEND_URL="${BACKEND_URL:-http://localhost:1818/e-master}"
EMAIL="${USER_EMAIL:-}"
PASSWORD="${USER_PASSWORD:-}"

if [[ -z "${EMAIL}" || -z "${PASSWORD}" ]]; then
  echo "Missing USER_EMAIL or USER_PASSWORD."
  exit 1
fi

echo "1) Health"
curl -fsS "${BACKEND_URL%/}/../health" >/dev/null
curl -fsS "${BACKEND_URL%/}/../health/ai" >/dev/null

echo "2) Login"
TOKEN="$(
  curl -fsS -X POST "${BACKEND_URL%/}/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(j.data?.token||j.token||"")})'
)"

if [[ -z "${TOKEN}" ]]; then
  echo "Login failed (no token)."
  exit 1
fi

AUTH=(-H "Authorization: Bearer ${TOKEN}")

echo "3) Generate learning path (if possible)"
curl -fsS -X POST "${BACKEND_URL%/}/learning-path/generate" "${AUTH[@]}" >/dev/null || true

echo "4) Get learning path"
curl -fsS "${BACKEND_URL%/}/learning-path" "${AUTH[@]}" >/dev/null

echo "5) Get recommendations"
curl -fsS "${BACKEND_URL%/}/learning-path/recommendations" "${AUTH[@]}" >/dev/null || true

echo "6) Daily plan"
curl -fsS "${BACKEND_URL%/}/daily-plan/today" "${AUTH[@]}" >/dev/null
curl -fsS "${BACKEND_URL%/}/daily-plan/streak" "${AUTH[@]}" >/dev/null

echo "OK"

