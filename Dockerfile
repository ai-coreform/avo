# syntax=docker/dockerfile:1.7

# ─── deps stage ─────────────────────────────────────────────────────────────
# Install workspace dependencies. Workspace package.json files are copied
# before any source so that this layer caches across non-dep changes.
FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/
COPY apps/admin/package.json apps/admin/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/public/package.json apps/public/
COPY packages/ui/package.json packages/ui/
COPY packages/menu/package.json packages/menu/

RUN bun install --frozen-lockfile

# ─── runtime stage ──────────────────────────────────────────────────────────
# Only ship what the backend actually needs at runtime: backend src + the
# workspace packages it imports from (currently `@avo/menu`).
FROM oven/bun:1.3 AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.base.json ./
COPY apps/backend ./apps/backend
COPY packages ./packages

EXPOSE 4000

# Railway overrides this via railway.toml's `startCommand`, but we set it
# here so `docker run` works locally too.
CMD ["bun", "run", "--cwd", "apps/backend", "start:railway"]
