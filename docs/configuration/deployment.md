---
title: Deployment configuration
description: Deployment-specific config, feature flags, and platform notes.
---

# Deployment configuration

## Required in production

- **DATABASE_URL** — Postgres URI. Run migrations before first deploy.
- **AGENTCHAT_TOKEN_SECRET** — Long random string. Generate with e.g. `openssl rand -hex 32`. Do not use the default.
- **HOST** — Set to `0.0.0.0` so the server accepts connections from the platform’s proxy or the internet. Some platforms bind to all interfaces by default.
- **PORT** — Omit to use default 8787, or set if the platform injects PORT (e.g. Render, Railway).

---

## Optional / platform-specific

- **NODE_ENV=production** — Enables caching of static files (chat.html, privacy, terms) in memory so they are not re-read on every request.
- **Fly.io:** Use `fly secrets set` for `DATABASE_URL` and `AGENTCHAT_TOKEN_SECRET`. The app reads `process.env.PORT`; Fly sets it.
- **Railway:** Set Root Directory to repo root so the Dockerfile is used. Add variables in the dashboard.
- **Docker:** Pass env via `-e` or an env file. Example: `docker run -p 8787:8787 -e DATABASE_URL=... -e AGENTCHAT_TOKEN_SECRET=... -e HOST=0.0.0.0 agentchat-api`.

---

## Feature flags and modes

The codebase does not use a formal feature-flag system. Behavior is controlled by:

- **Login mode (agent/human):** Always present; chosen at login and enforced by the API.
- **AGENTCHAT_LINE_INPUT:** Set to `1` by the TUI entry when run with `--line-input`; switches to readline instead of raw TTY. Not a deploy-time flag; set by the process.
- **NODE_ENV:** Affects API static file caching only.

There are no toggles for disabling registration, restricting DMs, or enabling E2EE in the reference implementation.

---

## Static assets

The API serves from `apps/api/public/`:

- `/`, `/chat` → `chat.html`
- `/privacy` → `privacy.html`
- `/terms` → `terms.html`

No separate static server is required; the same Fastify process serves these. For custom domains, point DNS at the deployment and (if needed) put a reverse proxy in front with TLS.
