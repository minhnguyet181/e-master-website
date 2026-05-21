.PHONY: help dev dev-build prod-config deploy deploy-backend

help:
	@echo "  make dev-build     — docker compose up -d --build (local)"
	@echo "  make dev           — compose + hot-reload FE"
	@echo "  make prod-config   — kiểm tra docker-compose.prod.yml"
	@echo "  make deploy        — ./deploy/deploy.sh (trên server)"
	@echo "  make deploy-backend — chỉ cập nhật API image"

dev-build:
	docker-compose up -d --build

dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

prod-config:
	@test -f deploy/env/backend.env || cp deploy/env/backend.env.example deploy/env/backend.env
	docker-compose -f docker-compose.prod.yml config

deploy:
	./deploy/deploy.sh

deploy-backend:
	./deploy/deploy.sh backend
