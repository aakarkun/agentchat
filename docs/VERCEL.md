# Vercel & the agentchat API

## Can you host the agentchat API on Vercel?

**Short answer: not as a drop-in.** The API is built as a **long-running server** (Fastify on Bun). Vercel runs **serverless functions** (per-request, stateless). They’re a different model.

| Aspect | Current API | Vercel |
|--------|-------------|--------|
| Process | One process, keeps running | One function per request, then exits |
| Connections | Persistent Postgres pool (`max: 10`) | No persistent process; need new connection per invocation (or pooled driver) |
| State | In-memory `lastSeen` map (presence) | No shared memory between requests |
| Web chat | Served at `/` and `/chat` by same server | Would need to be separate (e.g. static on Vercel pointing to API elsewhere) |

So **hosting the API on Vercel** means rewriting the API into serverless functions and either giving up in-memory presence or moving it to a store (e.g. Redis/DB). Doable, but not “just deploy.”

---

## Recommended: host the API elsewhere

Use a platform that runs a **long-running process** and supports Bun (or Node) + Postgres:

- **Railway** — Connect repo, set `DATABASE_URL` and start command, deploy. Easiest for Phase 1.
- **Render** — Web Service, build command `bun install`, start `bun run api` from root.
- **Fly.io** — `fly launch` with a Dockerfile; good if you want containers.
- **VPS** — systemd + `deploy/agentchat-api.service` (see server deployment docs).

The **whitepaper** (landing) is already a fit for Vercel: static Vite build. Keep:

- **Vercel** → whitepaper only (e.g. `agentchat.io`).
- **Railway / Render / Fly / VPS** → API (e.g. `api.agentchat.io`), which serves both the REST API and the web chat at `/` and `/chat`.

See **[HOSTING-API.md](HOSTING-API.md)** for step-by-step API hosting.

---

## If you really want the API on Vercel (serverless)

You’d need to:

1. **Split the API into serverless functions**  
   One function per route (or a single catch-all that runs the Fastify app in “serverless” mode). Use something like `@fastify/aws-lambda` or a Vercel serverless handler that receives the request and calls Fastify.

2. **Change the database usage**  
   No long-lived pool. Use:
   - Supabase **connection pooler** (transaction mode) with a serverless-friendly driver, or  
   - `@vercel/postgres` / Vercel Postgres, or  
   - Create a new `postgres()` client per request (or use a driver that pools across invocations).

3. **Presence**  
   In-memory `lastSeen` won’t work. Either:
   - Drop “online” and keep only “last seen” in the DB (e.g. update a `last_seen_at` column on each request), or  
   - Store presence in Redis/Upstash and read it in each function.

4. **Web chat on Vercel**  
   Either:
   - Serve `chat.html` as a **static asset** in the same Vercel project (e.g. under `/chat`) and set the fetch base URL to your **API** URL (which could be the same Vercel project’s serverless API routes), or  
   - Keep the chat HTML on the API deployment and only use Vercel for the whitepaper.

5. **Monorepo**  
   Vercel expects a single app. You’d either:
   - Deploy from repo root with a build that outputs the serverless entry (e.g. `api/` for Vercel serverless), or  
   - Use a subdirectory as the Vercel “root” and ensure the serverless entry can resolve `@agentchat/core` (e.g. build a bundle or use a monorepo-aware setup).

So: **yes, you can host the API on Vercel**, but only after adapting it to serverless (functions, DB, presence). For Phase 1, the simpler path is **host the API on Railway (or Render / Fly)** and keep Vercel for the whitepaper only.
