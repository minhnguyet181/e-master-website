# e-master-website
Website for self-study English

## Production MVP checklist (managed services)

### Backend env
- **DB**: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_PORT`, `DB_NAME`
- **Auth**: `JWT_SECRET`, `JWT_EXPIRES_IN`
- **AI (Gemini)**: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-1.5-flash`
- **Optional**: `AI_CACHE_TTL_MINUTES`, `AI_RATE_LIMIT_MAX`, `ONBOARDING_AI_RATE_LIMIT_MAX`, `GRADING_RATE_LIMIT_MAX`
- **CORS**: `FRONTEND_URL`

### Migrations
Run in `Back-end/`:

```bash
npm run db:migrate
```

### Health checks
- Backend container: `GET /health`, `GET /health/ai`
- Qua frontend nginx (production): `GET /e-master/health` → proxy tới `/health`

### Smoke test
From `Back-end/`:

```bash
export BACKEND_URL="http://localhost:1818/e-master"
export USER_EMAIL="your_user@example.com"
export USER_PASSWORD="your_password"
bash scripts/smoke-test.sh
```
