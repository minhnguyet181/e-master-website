# ── Stage 1: deps ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: runtime ───────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Copy only production deps from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 1818

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:1818/e-master || exit 1

CMD ["node", "server.js"]
