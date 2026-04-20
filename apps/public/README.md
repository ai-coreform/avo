# Avo Public

Public-facing Avo surfaces (landing + trial signup, with the customer menu moving in later). Next.js 16, React 19, Tailwind v4.

## Routes

- `/` — marketing landing page
- `/prova-gratis` — trial signup form
- `/api/trial` — Notion + Slack webhook for form submissions

## Develop

```bash
bun install
bun --filter @avo/public dev
```

Open http://localhost:3002.

## Environment

Create `.env` (or `.env.local`) with:

```
NOTION_API_KEY=...
NOTION_CRM_DATABASE_ID=...
SLACK_WEBHOOK_URL=...
```

`/api/trial` infers the allowed origin from the live host at request time, so no site-URL config is needed.
