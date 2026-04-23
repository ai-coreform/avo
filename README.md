# avo

Bun monorepo. Three apps, one shared UI package, one source of truth for every dep.

## Layout

```
avo/
├── apps/
│   ├── admin/      @avo/admin    — Next.js 16 (port 3001)
│   ├── dashboard/  @avo/dashboard — Next.js 16 (port 3000)
│   └── backend/    @avo/backend  — Hono + Bun (port 4000)
└── packages/
    └── ui/         @avo/ui       — shared shadcn components + cn/utils
```

`@avo/dashboard` and `@avo/admin` import UI from `@avo/ui` and types from `@avo/backend/types` (Hono RPC).

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- Docker Desktop (backend uses a local Postgres via `docker compose`)
- Node ≥ 20

## Getting started

```bash
bun install   # single install at root, hoists everything
bun dev       # starts all three apps in parallel (prefixed logs)
```

Targeted dev if you only need one:

```bash
bun dev:web       # http://localhost:3000
bun dev:admin     # http://localhost:3001
bun dev:backend   # docker db + Hono on :4000
```

## Scripts (run from root)

| Command | What |
|---|---|
| `bun dev` | all three dev servers in parallel |
| `bun dev:web` / `dev:admin` / `dev:backend` | single app |
| `bun build` | build every workspace |
| `bun lint` | Ultracite (Biome) auto-fix across the repo |
| `bun check` | Ultracite check (no writes) |
| `bun type-check` | `tsc --noEmit` in every workspace |
| `bun db:studio` | Drizzle Studio |
| `bun db:migrate` / `db:generate` / `db:push` / `db:reset` / `db:seed` / `db:seed-lite` / `db:auth-generate` | backend DB ops |

Any backend script can also be hit directly: `bun --filter @avo/backend <script>`.

## Dependency catalog

Shared dep versions live in one place — the `workspaces.catalog` field of the root [package.json](package.json). Workspaces reference them with `"react": "catalog:"` instead of a literal version. Bumping `react` once in the catalog moves every app together.

Shared dev tooling (`@biomejs/biome`, `typescript`, `ultracite`, `lefthook`) lives in root `devDependencies` — hoisted, not duplicated per app.

## Tooling

- **Lint / format**: [Ultracite](https://ultracite.dev) (Biome-based). Config at root [biome.jsonc](biome.jsonc). Pre-commit via [lefthook.yml](lefthook.yml) formats staged files.
- **Agent instructions**: [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) at root (same content — covers both OpenAI and Anthropic agent conventions).
- **Cursor**: [.cursor/](./.cursor) rules + hooks at root.
- **IDE launch configs**: [.claude/launch.json](./.claude/launch.json).

## Backend notes

- DB: Postgres + pgvector via [apps/backend/docker-compose.yml](apps/backend/docker-compose.yml). `bun dev:backend` starts it automatically. Volume is `avo-backend_avo-db-new`.
- Migrations: Drizzle. Source at `apps/backend/src/db/migrations/`. Apply with `bun db:migrate`.
- Types for the frontend: Hono RPC — backend exports `AppType` via `@avo/backend/types` (resolved from pre-built `.d.ts` so the consumer's type graph doesn't chase the backend's source). Rebuild with `bun --filter @avo/backend build` if you change routes.

## Adding a new shared component

1. Drop it in `packages/ui/src/components/ui/<name>.tsx`.
2. Import in apps as `@avo/ui/components/ui/<name>`.
3. Tailwind v4 auto-picks it up — both apps' CSS has `@source "../../../../packages/ui/src/**/*.{ts,tsx}"`.

## Adding a new workspace dependency

- Unique to one app → add it normally: `bun add <pkg> --filter @avo/dashboard`.
- Shared across apps → add to the root `workspaces.catalog`, then reference as `"<pkg>": "catalog:"` in each workspace's `package.json`, then `bun install`.
