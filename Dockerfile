# syntax=docker/dockerfile:1.7
# Backend deploy image — bun version pinned via the BUN_VERSION arg.
# Keep this in lockstep with package.json's `packageManager` field.
ARG BUN_VERSION=1.3.13

FROM oven/bun:${BUN_VERSION} AS base
WORKDIR /app
ENV NODE_ENV=production


# ---- deps: install the whole workspace from a cached layer ----
FROM base AS deps
# Workspace layout needs every package.json up front so `bun install` resolves
# the workspace graph cleanly. Source lands later so this layer is cacheable.
# `bunfig.toml` (linker = "hoisted") is required so node_modules survives
# cross-stage COPY without breaking subpath imports like `drizzle-orm/bun-sql`.
COPY package.json bun.lock bunfig.toml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/dashboard/package.json ./apps/dashboard/package.json
COPY apps/public/package.json ./apps/public/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/menu/package.json ./packages/menu/package.json
RUN bun install --frozen-lockfile


# ---- build: tsc the backend (catches type errors at build time) ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json bunfig.toml package.json bun.lock ./
COPY apps/backend ./apps/backend
COPY packages ./packages
RUN bun run --cwd apps/backend build


# ---- runtime: minimal image with only what the server needs ----
FROM base AS runtime
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend ./apps/backend
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json /app/bun.lock /app/bunfig.toml ./
USER bun
EXPOSE 4000

# Railway overrides via railway.toml's `startCommand`, but this lets
# `docker run` work locally too.
CMD ["bun", "run", "--cwd", "apps/backend", "start:railway"]
