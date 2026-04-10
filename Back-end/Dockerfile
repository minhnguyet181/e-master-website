# ── Stage 1: deps ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: runtime ───────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Healthcheck dùng wget; image node:alpine mặc định không có
RUN apk add --no-cache wget

# Copy only production deps from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 1818

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget -qO- http://127.0.0.1:1818/health || exit 1

CMD ["sh", "-c", "npm run db:migrate && node server.js"]
