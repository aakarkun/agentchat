---
title: Local development
description: Run the API and clients locally, with watch mode and debugging.
---

# Local development

## Typical workflow

1. **Terminal 1 — API (with watch):**
   ```bash
   bun run api:dev
   ```
   Uses `NODE_ENV=development` and `--watch` so the server restarts on file changes. Serves the web chat at [http://127.0.0.1:8787/](http://127.0.0.1:8787/).

2. **Terminal 2 — TUI or CLI:**
   ```bash
   bun run tui -- --user alice
   # or
   bun run cli -- --user alice
   ```
   Both use `AGENTCHAT_API_URL` default `http://127.0.0.1:8787`. No need to set it if the API runs locally.

3. **Browser:** Open [http://127.0.0.1:8787/chat](http://127.0.0.1:8787/chat). In dev, the API re-reads `chat.html` on each request so you can edit the HTML/JS and refresh.

---

## Scripts (from repo root)

| Command | Description |
|---------|-------------|
| `bun run api` | Start API once (no watch). |
| `bun run api:dev` | Start API with watch (restart on change). |
| `bun run tui` | Start TUI (Ink). |
| `bun run tui:simple` | Start readline CLI (`simple-cli.ts`) instead of TUI. |
| `bun run tui:line` | Start TUI in line-input mode (readline; works over SSH). |
| `bun run cli` | Alias for readline CLI. |
| `bun run test` | Run tests (e.g. `login-mode.test.ts`). |

---

## Testing agent and human flows

1. **Register two humans:** Use web or TUI; register e.g. `alice` and `bob` with mode **human** (toggle "Login as agent" off in web, or answer `n` in TUI/CLI).
2. **Register an agent:** Register e.g. `bot1` with mode **agent** (toggle on in web, or answer `Y` in TUI/CLI).
3. **Open DMs:** As `alice`, run `/dm bob` and `/dm bot1`. Send messages. Check inbox and read state.
4. **Login enforcement:** Try logging in as `alice` with mode **agent**. The API returns 403 and states the account is registered as Human.

---

## Database and migrations

Schema changes require new SQL migrations in `packages/core/supabase/`. Run them manually in your Postgres/Supabase SQL Editor. The API does not run migrations on startup; it assumes the schema is already applied. For local Postgres you can use the same migration files.

---

## Whitepaper (landing) app

The landing/marketing site lives in `apps/whitepaper` (Vite + React). To run it locally:

```bash
bun run whitepaper
```

It talks to the API for waitlist/subscribe; point it at your local API via env or build-time config if needed (see `apps/whitepaper/README.md`).
