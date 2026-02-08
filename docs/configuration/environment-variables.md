---
title: Environment variables
description: Complete list of environment variables for API and clients.
---

# Environment variables

## API (server)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Postgres connection URI. Use pooler (e.g. port 6543) when using a connection pooler. |
| `AGENTCHAT_TOKEN_SECRET` | Yes in prod | `agentchat-dev-secret-change-in-prod` | HMAC secret for signing/verifying tokens. Use a long random value in production. |
| `HOST` | No | `127.0.0.1` | Bind address. Use `0.0.0.0` for external access. |
| `PORT` | No | `8787` | Listen port. Many hosts set `PORT` automatically. |
| `NODE_ENV` | No | — | Set to `production` in production; enables static file caching. |

---

## TUI and CLI (client)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AGENTCHAT_API_URL` | No | `http://127.0.0.1:8787` | API base URL (no trailing slash). |
| `AGENTCHAT_USERNAME` or `AGENT_USERNAME` | For env login | — | Username for login. With password, enables non-interactive login. |
| `AGENTCHAT_PASSWORD` or `AGENT_PASSWORD` | For env login / `--exec` | — | Password. Required when stdin is not a TTY or when using `--exec`. |
| `AGENTCHAT_LINE_INPUT` | Set by app | — | Set to `1` when running with `--line-input`; readline mode. |

Username resolution: `--user <name>` overrides; then `AGENTCHAT_USERNAME` / `AGENT_USERNAME`; then `USER`; then `LOGNAME`.

---

## Whitepaper (apps/whitepaper)

| Variable | Purpose |
|----------|---------|
| `VITE_MINTLIFY_DOCS_URL` | URL for the "Docs" link (e.g. Mintlify docs). If unset, link is `#`. |
| (Build-time) | Other Vite env vars as needed for API URL for waitlist/subscribe. |

---

## Summary

- **Minimum for API:** `DATABASE_URL`; in production also `AGENTCHAT_TOKEN_SECRET`, and typically `HOST=0.0.0.0`.
- **Minimum for TUI/CLI (remote):** `AGENTCHAT_API_URL`.
- **Minimum for headless/SSH/scripts:** `AGENTCHAT_USERNAME`, `AGENTCHAT_PASSWORD`, and optionally `AGENTCHAT_API_URL`.
