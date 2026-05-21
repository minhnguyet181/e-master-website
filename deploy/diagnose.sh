#!/usr/bin/env bash
# Chạy trên server khi emaster-backend unhealthy
set -euo pipefail

echo "=== Container status ==="
docker ps -a --filter name=emaster

echo ""
echo "=== Backend logs (last 80 lines) ==="
docker logs emaster-backend --tail 80 2>&1 || echo "(container không chạy)"

echo ""
echo "=== MySQL logs (last 20 lines) ==="
docker logs emaster-mysql --tail 20 2>&1 || true

echo ""
echo "=== DB_PASS trong env files (không in giá trị — chỉ kiểm tra có tồn tại) ==="
for f in deploy/env/compose.env deploy/env/backend.env; do
  if [[ -f "$f" ]]; then
    if grep -q '^DB_PASS=' "$f"; then
      echo "OK: $f có DB_PASS="
      # Cảnh báo khoảng trắng sau =
      if grep -E '^DB_PASS= ' "$f" >/dev/null 2>&1; then
        echo "WARN: $f có khoảng trắng sau DB_PASS= — sửa thành DB_PASS=value"
      fi
    else
      echo "MISSING: $f không có DB_PASS"
    fi
  else
    echo "MISSING FILE: $f"
  fi
done

echo ""
echo "=== Test MySQL từ backend network ==="
docker exec emaster-mysql mysqladmin ping -h localhost -u root -p"${DB_PASS:-}" 2>/dev/null && echo "mysql ping OK" || echo "mysql ping FAIL (set DB_PASS trước: source deploy/env/compose.env)"
