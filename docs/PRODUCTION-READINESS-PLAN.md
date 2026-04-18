# Production readiness plan (from SECURITY-AND-SCALE)

## Current state

- **Already done**: Token secret fail-fast in production, input limits (username/password/message), rate limit 200/min, security headers, XSS sanitization in chat, Docker non-root, systemd with `NODE_ENV` and token-secret comment.
- **Gaps**: Login lacks same validation as register; `/users` unbounded; auth-specific rate limit may not apply (per-route config); no CORS/CSP/audit logging; Docker and hosting docs don't enforce checklist.

---

## 1. Checklist items (code)

### 1.1 Login validation (match register)

- **File**: `apps/api/src/index.ts` — `/auth/login` handler (around line 152).
- **Change**: Before `login(username, password)`, validate with same rules as register: `String(username).trim()` length ≤ `MAX_USERNAME_LEN`; `String(password)` length ≤ `MAX_PASSWORD_LEN`. Return `400` with a generic message (e.g. "Invalid request") for invalid length so we don't do Argon2 on huge passwords and we keep behavior consistent with register.

### 1.2 Auth-specific rate limit (guarantee 10/min)

- **File**: `apps/api/src/index.ts`.
- **Change**: The current `onRoute` sets `opts.config.rateLimit`; not all Fastify rate-limit plugins honor per-route config. To be sure without depending on plugin internals:
  - Add a small in-memory store (e.g. `Map<string, { count: number; resetAt: number }>`) keyed by IP.
  - Add a `preHandler` on `/auth/login` and `/auth/register` that:
    - Gets IP from `request.ip` (or `request.headers['x-forwarded-for']` if behind proxy).
    - Enforces 10 requests per minute per key; if over limit, reply `429` and return.
  - Keep the global `@fastify/rate-limit` (200/min). Remove the `onRoute` block and the long comment block (lines 41–58) to avoid confusion.

### 1.3 `/users` cap (scale safeguard)

- **File**: `apps/api/src/index.ts` — `GET /users` handler.
- **Change**: Cap the returned list (e.g. first 2000 usernames). In `packages/core` either add a `listUsers(limit?: number)` or cap in the API: `listUsers().map(...).slice(0, 2000)`. Document in `docs/SECURITY-AND-SCALE.md` that at scale you should add pagination/search.

---

## 2. Optional hardening (from doc)

### 2.1 CORS (env-driven)

- **File**: `apps/api/src/index.ts`.
- **Change**: Register `@fastify/cors` when `CORS_ORIGIN` (or `CORS_ORIGINS`) is set. Allow only that origin(s). If unset, skip CORS (same-origin). Add dependency `@fastify/cors` in `apps/api/package.json`.

### 2.2 CSP for web chat

- **File**: `apps/api/src/index.ts`.
- **Change**: In the handlers for `GET /` and `GET /chat`, set a `Content-Security-Policy` header before sending `chatHtml`. Policy: allow `self`; scripts from `self` and `https://cdn.jsdelivr.net` (and `unsafe-inline` if the chat stays inline); styles from `self`, `unsafe-inline`, `https://fonts.googleapis.com`, `https://cdn.jsdelivr.net`; fonts from `https://fonts.gstatic.com`; `connect-src 'self'`. Tune if you later move scripts off inline.

### 2.3 Audit logging

- **File**: `apps/api/src/index.ts`.
- **Change**: Use existing Fastify logger. After each auth outcome, log one line (no passwords): e.g. `request.log.info({ event: 'login_ok', username })`, `request.log.info({ event: 'login_fail', reason: 'invalid_credentials' })`, same for register (success / username_taken / validation_fail) and logout (username). Optionally include `request.ip` for security review.

---

## 3. Deployment and docs

### 3.1 Docker production defaults

- **File**: `Dockerfile`.
- **Change**: Add `ENV NODE_ENV=production` so the token-secret check runs by default in the image. Operators can still override if needed.

### 3.2 systemd secret without pasting

- **File**: `deploy/agentchat-api.service` and/or `docs/SERVER-DEPLOY.md`.
- **Change**: Add a commented line showing loading the secret from a file, e.g. `EnvironmentFile=/opt/agentchat/.env.agentchat` (or a systemd credential path), and instruct to set `AGENTCHAT_TOKEN_SECRET` there so the secret isn't in the unit file.

### 3.3 Hosting docs point to checklist

- **Files**: `docs/HOSTING.md`, `docs/SERVER-DEPLOY.md`.
- **Change**: In each, add a short "Before going live" subsection that links to `docs/SECURITY-AND-SCALE.md` and lists: set `AGENTCHAT_TOKEN_SECRET`, set `NODE_ENV=production`, use HTTPS (reverse proxy), (optional) stricter auth rate limit at proxy, back up DB, run container as non-root. No need to duplicate the full checklist.

### 3.4 SECURITY-AND-SCALE.md updates

- **File**: `docs/SECURITY-AND-SCALE.md`.
- **Change**: Under "Optional hardening", note that CORS (when `CORS_ORIGIN` set), CSP for chat, and audit logging for auth events are implemented; optionally add one line each. Add a line that `/users` is capped (e.g. 2000) and that auth routes have an in-app 10/min rate limit.

---

## 4. Code hygiene

- **File**: `apps/api/src/index.ts`.
- **Change**: Remove the obsolete comment block (lines 48–58) and the `onRoute` hook once the explicit auth rate limit preHandler is in place.

---

## 5. Order of work (fast path)

| Step | Task | Deps |
|------|------|------|
| 1 | Login validation (1.1) | None |
| 2 | Auth rate limit preHandler + remove onRoute and comments (1.2, 4) | None |
| 3 | `/users` cap (1.3) | None |
| 4 | CORS (2.1) | Add `@fastify/cors` |
| 5 | CSP for / and /chat (2.2) | None |
| 6 | Audit logging (2.3) | None |
| 7 | Docker `NODE_ENV` (3.1) | None |
| 8 | systemd EnvironmentFile example (3.2) | None |
| 9 | HOSTING + SERVER-DEPLOY "Before going live" (3.3) | None |
| 10 | SECURITY-AND-SCALE.md tweaks (3.4) | 1–3, 2.1–2.3 |

---

## 6. Out of scope (per doc)

- **HTTPS / backups**: Operational (reverse proxy, cron); no code change.
- **PostgreSQL / Redis / WebSockets / full `/users` pagination**: Doc says "at millions"; not part of "quick production ready."

---

## Summary

- **Checklist in code**: Enforce token secret (done), login validation, auth 10/min rate limit, `/users` cap, and document Docker/systemd and hosting so the checklist is visible at deploy time.
- **Optional hardening**: CORS (env), CSP (chat), audit logging (auth).
- **Docs**: One "Before going live" block in HOSTING and SERVER-DEPLOY linking to SECURITY-AND-SCALE; small updates in SECURITY-AND-SCALE for what's implemented.
