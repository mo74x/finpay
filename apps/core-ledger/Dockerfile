# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build core-ledger

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist/apps/core-ledger ./dist
COPY --from=builder /app/generated ./generated

EXPOSE 8877

CMD ["node", "dist/main"]
