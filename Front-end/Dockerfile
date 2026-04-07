# ── Stage 1: build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Inject build-time env vars (passed via --build-arg)
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID

RUN npm run build

# ── Stage 2: serve with nginx ───────────────────────────────────
FROM nginx:alpine AS runtime
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
