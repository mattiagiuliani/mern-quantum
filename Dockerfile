# Root Dockerfile — used by Render.com (build context = repo root).
# docker-compose.yml uses backend/Dockerfile with context ./backend instead.

# ── deps stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev

# ── runtime stage ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .

EXPOSE 3001
CMD ["node", "server.js"]
