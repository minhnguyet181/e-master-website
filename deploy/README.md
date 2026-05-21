# Production — 161.248.147.104 / https://e-master.id.vn

## Kiến trúc

| Thành phần | Vai trò |
|------------|---------|
| `mysql` | DB — volume `emaster_mysql_data` **giữ dữ liệu** khi `git pull` / đổi image |
| `backend` | API Express `:1818`, migrate khi start |
| `frontend` | nginx phục vụ React build + proxy `/e-master/` → backend |

Không có Redis/container thừa khi `QUEUE_ENABLED=false`.

## Env (bảo mật)

| File | Commit? | Nội dung |
|------|---------|----------|
| `.env.example` | Có | Mẫu dev compose (không secrets app) |
| `.env` | **Không** | Dev local compose |
| `deploy/env/compose.env` | **Không** | `DB_PASS`, `DOCKER_REGISTRY`, `IMAGE_TAG` |
| `deploy/env/backend.env` | **Không** | JWT, Gemini, CORS, toàn bộ biến Back-end |
| `deploy/env/*.example` | Có | Mẫu — **không** điền key thật |

**Bắt buộc:** `DB_PASS` và `DB_NAME` trong `compose.env` và `backend.env` phải giống nhau.

## Lần đầu trên server

```bash
sudo mkdir -p /opt/emaster && sudo chown "$USER" /opt/emaster
cd /opt/emaster
git clone <repo-url> .

cp deploy/env/compose.env.example deploy/env/compose.env
cp deploy/env/backend.env.example deploy/env/backend.env
# Chỉnh DB_PASS, JWT_SECRET, GEMINI_API_KEY, DOCKER_REGISTRY=ghcr.io/<user>

chmod +x deploy/deploy.sh
./deploy/deploy.sh

# Dừng stack (giữ volume DB): ./deploy/deploy.sh down
# Script tự gỡ container tên emaster-* (kể cả lần chạy compose project cũ gây conflict)
# Không chạy docker-compose down trực tiếp — thiếu --env-file deploy/env/compose.env
```

Đăng nhập GHCR (nếu image private):

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
```

## TLS (domain)

Container frontend map `8080:80` (tránh trùng cổng 80 với nginx host). TLS trên host:

```bash
sudo cp deploy/nginx/host-ssl.example.conf /etc/nginx/sites-available/e-master.id.vn
sudo ln -sf /etc/nginx/sites-available/e-master.id.vn /etc/nginx/sites-enabled/
sudo certbot --nginx -d e-master.id.vn
```

## Cập nhật sau khi push CI

```bash
cd /opt/emaster && git pull
./deploy/deploy.sh          # toàn bộ
./deploy/deploy.sh backend  # chỉ API — FE image không đổi, không rebuild FE
```

CI chỉ build/push `emaster-frontend` khi có thay đổi trong `Front-end/`.

## GitHub Actions secrets

| Secret | Ví dụ |
|--------|--------|
| `DEPLOY_HOST` | `161.248.147.104` |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_SSH_KEY` | private key SSH |
| `REACT_APP_GOOGLE_CLIENT_ID` | OAuth (build FE) |
| `REACT_APP_BACKEND_URL` | tùy chọn, mặc định `/e-master` |

Workflow `main`: build image → SSH `./deploy/deploy.sh` hoặc `backend` nếu không đổi FE.

## MySQL pull lỗi (Docker Hub timeout)

Backend/FE từ `ghcr.io` OK nhưng `mysql:8.0` lỗi `TLS handshake timeout` → server không ổn định tới `registry-1.docker.io`.

**Cách 1 — Thử lại:**

```bash
docker pull mysql:8.0
./deploy/deploy.sh
```

**Cách 2 — Mirror** (thêm vào `deploy/env/compose.env`):

```env
MYSQL_IMAGE=docker.m.daocloud.io/library/mysql:8.0
```

```bash
docker pull docker.m.daocloud.io/library/mysql:8.0
./deploy/deploy.sh
```

**Cách 3 — Copy image từ máy khác:** `docker save mysql:8.0 | ssh root@161.248.147.104 docker load`

## Backend unhealthy

```bash
chmod +x deploy/diagnose.sh
./deploy/diagnose.sh
# hoặc:
docker logs emaster-backend --tail 100
```

| Log / triệu chứng | Cách xử lý |
|-------------------|------------|
| `Access denied for user 'root'` | `DB_PASS` trong `backend.env` ≠ mật khẩu MySQL thật (volume cũ). Sửa `backend.env` khớp `compose.env`, hoặc reset volume (mất data): `docker volume rm emaster_mysql_data` rồi deploy lại |
| `DB_PASS= moon123` (có space) | Sửa thành `DB_PASS=moon123` cả 2 file env |
| `Table 'users' already exists` | Migrate dở — `docker exec emaster-backend npm run db:migrate` xem lỗi; có thể cần sửa `SequelizeMeta` hoặc DB sạch lần đầu |
| `MIGRATE FAILED` | Xem full log migrate phía trên |

Sau sửa env (không cần build lại image):

```bash
docker rm -f emaster-backend
docker-compose --env-file deploy/env/compose.env -f docker-compose.prod.yml up -d backend
```

## Kiểm tra

```bash
curl -sS http://127.0.0.1/e-master/health
curl -sS https://e-master.id.vn/e-master/health
```
