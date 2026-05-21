# e-master-website

Ứng dụng tự học tiếng Anh — React + Express + MySQL.

## Cấu trúc

```
├── Back-end/          API (Express, Sequelize)
├── Front-end/         React + nginx (production)
├── deploy/            Script & env production (server)
├── docker-compose.yml       Dev / build local
├── docker-compose.prod.yml  Production (3 container)
└── .github/workflows/       CI build image + deploy
```

## Dev local (Docker)

```bash
cp .env.example .env
cp Back-end/.env.example Back-end/.env
# Chỉnh Back-end/.env — DB_PASS khớp .env

docker compose up -d --build
# FE: http://localhost:3000  API: http://localhost:1818/e-master
```

Hot-reload FE:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## Production

Xem [deploy/README.md](deploy/README.md) — server `161.248.147.104`, domain [https://e-master.id.vn](https://e-master.id.vn).

```bash
./deploy/deploy.sh
./deploy/deploy.sh backend   # cập nhật API, không đổi FE image
```

## Env quan trọng

| Biến | Nơi đặt | Ghi chú |
|------|---------|---------|
| `DB_PASS`, `DB_NAME` | `.env` (dev) / `deploy/env/compose.env` (prod) | Khớp MySQL root |
| `JWT_SECRET` | `Back-end/.env` / `deploy/env/backend.env` | Bắt buộc production |
| `GEMINI_API_KEY` | backend env | AI grading/chat |
| `FRONTEND_URL` | backend env | CORS — `https://e-master.id.vn` |
| `REACT_APP_BACKEND_URL` | build-arg FE | Prod: `/e-master` (same-origin) |
| `REACT_APP_GOOGLE_CLIENT_ID` | CI secret / build-arg | OAuth |

## Migrations

Chạy tự động khi backend container start (`npm run db:migrate`). Thủ công trong `Back-end/`:

```bash
npm run db:migrate
```

## Health

- Backend: `GET /health`
- Qua nginx: `GET /e-master/health`
