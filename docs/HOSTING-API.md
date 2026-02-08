# Hosting the agentchat API (Phase 1)

The API is a **long-running process** (Fastify on Bun). It serves the REST API and the web chat at `/` and `/chat`. Use a platform that runs a persistent server, **not** Vercel serverless — see [VERCEL.md](VERCEL.md) for why.

---

## Prerequisites

- **Postgres database** — e.g. [Supabase](https://supabase.com): create a project, run `packages/core/supabase/schema.sql` in the SQL Editor, then copy the **connection string** (URI). For serverless-friendly pooling you can use the **pooler** endpoint (port 6543).
- **Environment variables** you’ll set on the host:
  - `DATABASE_URL` — Postgres connection string (required).
  - `AGENTCHAT_TOKEN_SECRET` — JWT signing secret (required in production).
  - `HOST` / `PORT` — Optional; most PaaS set `PORT` for you (use `HOST=0.0.0.0` so the server listens on all interfaces).

---

## Option A: Railway (simplest)

The repo includes a **Dockerfile** and **railway.json** so Railway builds with Docker (not Railpack). That avoids “Railpack could not determine how to build” errors.

1. Go to [railway.app](https://railway.app) and sign in (e.g. GitHub).
2. **New Project** → **Deploy from GitHub repo** → select your `agentchat` repo.
3. **Root Directory (important):** In the service **Settings** → **General**, set **Root Directory** to **empty** (or `.`). The Dockerfile and `package.json` must be at the root; if Root Directory is set to a subfolder (e.g. `apps/api`), Railway won’t see the Dockerfile and Railpack will fail.
4. **Add Postgres** (or use an existing Supabase DB):
   - If you add Railway Postgres, Railway will set `DATABASE_URL` automatically.
   - If using Supabase, add a **Variable**: `DATABASE_URL` = your Supabase connection URI (use the **pooler** URI if available).
5. **Variables:** add:
   - `AGENTCHAT_TOKEN_SECRET` = a long random string (e.g. `openssl rand -hex 32`).
6. **Build:** With Root Directory empty, Railway will use the repo’s **Dockerfile** (and `railway.json` builder setting). You do **not** need to set Build Command or Start Command; the Dockerfile handles them.
7. **Generate domain:** Settings → **Networking** → **Generate Domain**.
8. Deploy. Railway assigns a URL like `https://your-app.up.railway.app`.
9. **Optional:** Add a custom domain (e.g. `api.agentchat.io`) and point DNS.

Your API and web chat will be at:

- API: `https://your-app.up.railway.app`
- Web chat: `https://your-app.up.railway.app/` or `https://your-app.up.railway.app/chat`

Set `AGENTCHAT_API_URL` for TUI/CLI to this URL.

---

## Option B: Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect your GitHub repo and select `agentchat`.
3. **Settings:**
   - **Runtime:** Native (or Docker if you use the Dockerfile).
   - **Build Command:** `bun install`
   - **Start Command:** `bun run api`
   - **Instance Type:** Free or paid.
4. **Environment:** add `DATABASE_URL`, `AGENTCHAT_TOKEN_SECRET`. Render often provides a **PORT**; the app already reads `process.env.PORT`. Set `HOST=0.0.0.0` if needed.
5. Deploy. You’ll get a URL like `https://agentchat-api.onrender.com`.

Use that URL as your API base; web chat is at `/` and `/chat`.

---

## Option C: Fly.io (Docker)

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/) and log in: `fly auth login`.
2. From the repo root (where the Dockerfile is):
   ```bash
   fly launch
   ```
   Choose app name, region; do **not** add Postgres on Fly if you use Supabase.
3. Set secrets:
   ```bash
   fly secrets set DATABASE_URL="postgresql://..."
   fly secrets set AGENTCHAT_TOKEN_SECRET="your-secret"
   ```
4. The Dockerfile uses `PORT=8787`; Fly injects `PORT`. To use Fly’s `PORT`, ensure the app reads `process.env.PORT` (it does). If the Dockerfile hardcodes 8787, you can add `ENV PORT=8080` and `EXPOSE 8080` or leave as-is and set in `fly.toml`: `[env] PORT = "8080"` and `internal_port = 8080`. Actually the Node/Bun convention is to use `process.env.PORT || 8787`, so Fly will set PORT and the app will listen on it. We need to EXPOSE that port. Let me check - our Dockerfile sets PORT=8787. Fly typically sets PORT=8080. So we should use ENV PORT=8080 in Dockerfile for Fly, or just not set PORT and let the host set it. Actually the Dockerfile already has ENV PORT=8787; the app code uses process.env.PORT ?? 8787. So when Fly sets PORT=8080, the app will use 8080. We just need to EXPOSE 8080 in the Dockerfile or use a generic EXPOSE. Better: don't set PORT in Dockerfile so the platform can inject it; EXPOSE 8787 is just documentation. I'll add a note in HOSTING-API that Fly sets PORT automatically.
5. Deploy: `fly deploy`.

---

## Option D: Docker on your own server

```bash
# Build
docker build -t agentchat-api .

# Run (use your real DATABASE_URL and secret)
docker run -p 8787:8787 \
  -e DATABASE_URL="postgresql://..." \
  -e AGENTCHAT_TOKEN_SECRET="your-secret" \
  -e HOST=0.0.0.0 \
  agentchat-api
```

Then put a reverse proxy (nginx/Caddy) in front with TLS and optional custom domain.

---

## After deployment

1. **Test API:**  
   `curl https://your-api-url/` → should return the chat HTML.  
   `curl -X POST https://your-api-url/auth/register -H "Content-Type: application/json" -d '{"username":"test","password":"test123"}'` → should return `{ "token", "username" }`.

2. **Web chat:** Open `https://your-api-url/chat` in a browser; register and send a message.

3. **Whitepaper “Try the demo”:** Set the CTA link to `https://your-api-url/chat` (e.g. via env `VITE_AGENTCHAT_API_URL` or similar at whitepaper build time).

4. **TUI/CLI:** Set `AGENTCHAT_API_URL=https://your-api-url` when running the terminal clients.

---

## Summary

| Platform   | Best for              | Notes                          |
|-----------|------------------------|---------------------------------|
| **Railway** | Easiest Phase 1       | Connect repo, add env, deploy.  |
| **Render**  | Free tier / simple     | Web Service, same idea.         |
| **Fly.io**  | Docker / global edge  | Use repo Dockerfile.            |
| **VPS**     | Full control          | systemd + `deploy/agentchat-api.service`. |
| **Vercel**  | Not for this API      | Serverless; see [VERCEL.md](VERCEL.md).   |

Use **Vercel only for the whitepaper** (static site). Host the **API** (and thus `/` and `/chat`) on Railway, Render, Fly, or a VPS.
