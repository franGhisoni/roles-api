# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS builder
WORKDIR /app
# better-sqlite3 needs build tools for the native compile step
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    DATABASE_DRIVER=sqlite \
    DATABASE_URL=file:/data/roles.db
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app \
 && mkdir -p /data && chown app:app /data
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --chown=app:app package.json ./
USER app
VOLUME ["/data"]
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --spider -q http://localhost:${PORT:-4000}/api/v1/healthz || exit 1
CMD ["node", "dist/server.js"]
