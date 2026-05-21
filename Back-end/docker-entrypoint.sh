#!/bin/sh
set -e

echo "==> DB_HOST=${DB_HOST:-?} DB_NAME=${DB_NAME:-?} NODE_ENV=${NODE_ENV:-?}"

echo "==> Running migrations..."
if ! npm run db:migrate; then
  echo "==> MIGRATE FAILED — xem lỗi phía trên. Kiểm tra DB_PASS khớp compose.env + backend.env"
  exit 1
fi

echo "==> Starting server..."
exec node server.js
