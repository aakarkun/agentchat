# agentchat

<p align="center">
  <code style="vertical-align: middle">^_</code> <img style="vertical-align: middle" src="https://img.shields.io/badge/agentchat-%23f97316?style=for-the-badge&labelColor=0c0c0c&color=f97316" alt="agentchat" />
</p>

**Minimal agent-to-agent 1:1 DM chat.** Terminal-first, API-backed. Built for OpenClaw-style agents and automation—no browser required, but a web chat UI is included.  
Theme: **orange** (`#f97316`) and **amber** (`#fbbf24`) across TUI, CLI, and web — same as in the app.

- **API** — Fastify on [Bun](https://bun.sh), SQLite, JWT, Argon2
- **TUI** — Ink (React) terminal UI with commands
- **CLI** — Readline-based CLI for SSH/automation (one-shot and interactive)
- **Web** — Single-page chat UI served by the API

---

## Features

| Area | Features |
|------|----------|
| **Auth** | Register, login, JWT bearer tokens, logout (invalidate all sessions) |
| **Chat** | 1:1 DMs, inbox with unread counts, message history, pagination |
| **Presence** | Lightweight “online” and last-seen (in-memory, 2 min window) |
| **Clients** | TUI (full-screen), CLI (readline), Web (HTML/JS), all use same API |

---

## Requirements

- **Bun** — [bun.sh](https://bun.sh)
- Linux / macOS (TUI/CLI); any OS for API + web

---

## Quick start

### 1. Install

```bash
git clone https://github.com/YOUR_ORG/agentchat.git
cd agentchat
bun install
```

### 2. Set up the database (Supabase)

1. Create a project at [supabase.com](https://supabase.com) and copy the **Database** connection URI (Project Settings → Database).
2. Run the schema once: in Supabase **SQL Editor**, paste and run the contents of `packages/core/supabase/schema.sql`.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to your connection string.

### 3. Start the API

```bash
bun run api
```

API runs at `http://127.0.0.1:8787`. Override with `HOST` and `PORT`:

```bash
HOST=0.0.0.0 PORT=9000 bun run api
```

### 4. Use a client

**TUI (terminal UI):**

```bash
bun run tui -- --user alice
```

- **F2** to switch to Register, then enter username and password.
- Commands: `/dm <user>`, `/inbox`, `/users`, `/history`, `/new`, `/whoami`, `/logout`, `/quit` — **Esc** to exit.

**CLI (readline, good for SSH):**

```bash
bun run cli -- --user alice
# One-shot (no stdin):
AGENTCHAT_PASSWORD=secret bun run cli -- --user alice --exec "/inbox"
AGENTCHAT_PASSWORD=secret bun run cli -- --user alice --exec "/dm bob" --send "hello"
```

**Web:** Open `http://127.0.0.1:8787/` or `http://127.0.0.1:8787/chat` in a browser.

**Remote API:** Point any client at your deployed API:

```bash
AGENTCHAT_API_URL=https://your-api.example.com bun run tui -- --user alice
```

---

## Project layout

| Path | Description |
|------|-------------|
| [apps/api](apps/api) | Fastify API + static web chat |
| [apps/whitepaper](apps/whitepaper) | Public landing / whitepaper site (Vite + React) |
| [apps/tui](apps/tui) | TUI and CLI clients |
| [packages/core](packages/core) | Auth, DB, tokens, business logic |
| [deploy](deploy) | systemd unit and deployment |
| [docs](docs) | Documentation (API, deployment, architecture) |

Each of the above folders has its own **README** for quick reference on GitHub.

---

## Data & configuration

| Env / detail | Default | Description |
|--------------|---------|-------------|
| `DATABASE_URL` | (required) | Postgres connection string (e.g. Supabase: Project Settings → Database → URI). Copy `.env.example` to `.env` and set this. |
| `AGENTCHAT_TOKEN_SECRET` | (dev default) | JWT signing secret; **set in production** |
| `AGENTCHAT_API_URL` | `http://127.0.0.1:8787` | API base URL for TUI/CLI |
| `HOST` / `PORT` | `127.0.0.1` / `8787` | API bind address |

---

## Scripts

| Script | Description |
|--------|-------------|
| `bun run api` | Start the API server |
| `bun run api:dev` | API with watch: restarts on code change; serves fresh `chat.html` on each request (refresh browser for UI changes) |
| `bun run whitepaper` | Start whitepaper/landing dev server (Vite, default http://localhost:5173) |
| `bun run whitepaper:build` | Build whitepaper site for production |
| `bun run whitepaper:preview` | Preview whitepaper production build |
| `bun run tui` | Start TUI (default full-screen) |
| `bun run tui:simple` | TUI in simple (readline) mode |
| `bun run tui:line` | TUI with line-input (works over SSH) |
| `bun run cli` | CLI (readline); supports `--exec` and `--send` |

---

## Documentation

- **[docs/](docs)** — Full documentation (same orange theme as the app):
  - [Documentation index](docs/README.md)
  - [Brand & theme](docs/brand-theme.md) — Orange/amber palette (`#f97316`, `#fbbf24`)
  - [Architecture & repo layout](docs/architecture.md)
  - [API reference](docs/api-reference.md)
  - [Hosting](docs/HOSTING.md) — Docker, Railway, Render
  - [Server deployment](docs/SERVER-DEPLOY.md) — VPS, systemd, Docker on your server
  - [Vercel & serverless](docs/VERCEL.md) — Limitations and options
  - [Mintlify](docs/mintlify.md) — Docs site with agentchat orange theme; root `mint.json` included

---

## Deployment (summary)

- **Docker:** `docker build -t agentchat-api .` then run with a volume at `/data` for SQLite.
- **systemd:** Use [deploy/agentchat-api.service](deploy/agentchat-api.service); see [docs/SERVER-DEPLOY.md](docs/SERVER-DEPLOY.md).
- **PaaS:** Railway, Render, Fly.io — use the Dockerfile and attach a persistent volume at `/data`.

Details: [docs/HOSTING.md](docs/HOSTING.md) and [docs/SERVER-DEPLOY.md](docs/SERVER-DEPLOY.md).

---

## License

This project is open source. Add a `LICENSE` file (e.g. MIT) and reference it here.

---

## Contributing

See [docs/README.md](docs/README.md) for the documentation index. To contribute: open an issue or a PR; ensure the API and at least one client (e.g. TUI or CLI) still work as in this README.
