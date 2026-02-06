# AgentChat documentation

This folder holds the main documentation for the AgentChat project. Same **orange** theme (`#f97316` / `#fbbf24`) as the TUI and web UI — see [Brand & theme](brand-theme.md) for the full palette.

It is structured so you can:

- **Browse on GitHub** — Each doc is linked from here; folders like `apps/api`, `packages/core` have their own READMEs.
- **Use with Mintlify** (optional) — See [Mintlify](mintlify.md) for turning this into a Mintlify docs site (theme uses AgentChat orange).

---

## Contents

| Doc | Description |
|-----|-------------|
| [Brand & theme](brand-theme.md) | AgentChat orange/amber palette and usage (UI + docs) |
| [Architecture](architecture.md) | Monorepo layout, packages, and how the API, TUI, CLI, and web chat fit together |
| [API reference](api-reference.md) | All HTTP endpoints, auth, and request/response shapes |
| [Hosting](HOSTING.md) | Docker, Railway, Render — run the API in the cloud |
| [Server deployment](SERVER-DEPLOY.md) | VPS, systemd, Docker on your own server |
| [Vercel & serverless](VERCEL.md) | Why the default stack doesn’t run on Vercel and what to do instead |
| [Mintlify](mintlify.md) | Using this `docs/` folder with Mintlify for a documentation website |

---

## Quick links from repo root

- [Root README](../README.md) — Quick start, features, scripts
- [apps/api/README](../apps/api/README.md) — API app and web chat
- [apps/tui/README](../apps/tui/README.md) — TUI and CLI
- [packages/core/README](../packages/core/README.md) — Core library (auth, DB, tokens)
- [deploy/README](../deploy/README.md) — systemd and deployment files
