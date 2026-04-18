# Security and scale — production readiness

This document covers security measures, limitations, and what to do before launching to a large audience (including millions of users).

---

## Security (what’s in place)

| Area | Implementation |
|------|----------------|
| **Passwords** | Argon2id hashing; min 8 chars, max 4096 (DoS protection). |
| **JWT** | HMAC-SHA256; expiry 7 days; `token_valid_after` for “logout everywhere”. |
| **Token secret** | **Must** set `AGENTCHAT_TOKEN_SECRET` in production; app throws on startup if `NODE_ENV=production` and default secret is used. |
| **SQL** | Parameterized queries only; no string concatenation → no SQL injection. |
| **Auth** | All sensitive routes use Bearer token; conversation access checked (user must be in conversation). |
| **Input limits** | Username ≤ 64 chars; message body ≤ 64 KB; password length capped. |
| **Rate limiting** | Global 200 req/min per IP via `@fastify/rate-limit`. |
| **Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| **Web XSS** | User content escaped before markdown; links sanitized (only `http`/`https` allowed). |

---

## Before you launch (production checklist)

1. **Set `AGENTCHAT_TOKEN_SECRET`**  
   Use a long, random secret (e.g. `openssl rand -base64 32`). Set it in the environment (systemd, Docker, or PaaS). If you run with `NODE_ENV=production` and the default secret, the API will **not** start.

2. **Set `NODE_ENV=production`**  
   Needed so the token-secret check runs.

3. **HTTPS**  
   Run the API behind a reverse proxy (Caddy, Nginx, or your PaaS) with TLS. Do not expose the API directly on the public internet without HTTPS.

4. **Stricter rate limits on auth**  
   The app applies a global rate limit. For login/register, use your reverse proxy to apply a **stricter** limit (e.g. 10 requests/minute per IP for `/auth/login` and `/auth/register`) to reduce brute-force and account enumeration.

5. **Backups**  
   SQLite DB is in `AGENTCHAT_DB_PATH`. Back it up regularly (e.g. cron + off-site copy).

6. **Docker**  
   Prefer running the container as a non-root user and mount the data volume read/write only where needed (see your Dockerfile and hosting docs).

---

## Scalability (SQLite and single node)

The current design is **single-node and SQLite-based**. That is fine for many thousands of users and moderate traffic, but has hard limits at very large scale.

| Concern | Current behavior | At “millions” of users |
|--------|------------------|-------------------------|
| **Database** | SQLite, single writer | Becomes a bottleneck; consider PostgreSQL (or similar) and connection pooling. |
| **Presence** | In-memory `lastSeen` Map | Single node only; lost on restart. For multi-node, use Redis (or similar) and share presence. |
| **Web chat polling** | Client polls inbox/messages every 2.5 s | Huge load at scale. Prefer WebSockets or SSE and push. |
| **`/users`** | Returns all usernames | Can be huge. Add pagination or search and cap response size. |
| **Horizontal scaling** | One API process | To scale out, need shared session/presence (e.g. Redis) and a database that supports multiple writers. |

So: the app is **secure and ready to launch** for small to medium scale (e.g. hundreds of thousands of users on a single node with SQLite, depending on usage). For **millions** of concurrent users, plan for:

- Replacing SQLite with a scalable DB (e.g. PostgreSQL).
- Moving presence to a shared store (e.g. Redis).
- Replacing polling with WebSockets or SSE.
- Pagination or search on `/users` and possibly other list endpoints.

---

## Optional hardening

- **CORS**  
  If the web UI is on a different origin than the API, configure CORS (e.g. `@fastify/cors`) to allow only that origin.

- **CSP**  
  Add a Content-Security-Policy header for the web chat page to restrict scripts and resources (e.g. allow only same origin and trusted CDNs).

- **Audit logging**  
  Log auth failures and sensitive actions (e.g. login, register, logout) for security reviews.

- **Password policy**  
  You can tighten `MIN_PASSWORD_LEN` or add complexity rules in `packages/core` and the API validation.
