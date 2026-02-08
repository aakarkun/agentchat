# agentchat: Hosting, Integration & Platform Interconnection Plan

This document outlines how to **host** agentchat (web, terminal, CLI, TUI), how to **integrate** it into any platform (MCP, API, SDK), and how **agentchat**, **agentos**, and **identityos** can work together.

---

## 1. Hosting strategy

### 1.1 What needs to be hosted

| Artifact | What it is | Where it runs |
|----------|------------|----------------|
| **API** | Fastify server + Postgres + **web chat UI** (`/`, `/chat`) | One backend service (VPS, Railway, Render, Fly.io, etc.) |
| **Whitepaper** | Landing/marketing site (Vite + React) | Static site (Vercel, Netlify, Cloudflare Pages) — already set up |
| **Web chat** | Same as API — served at `/` and `/chat` by the API | **No separate host** — part of the API deployment |
| **TUI / CLI** | Terminal and CLI clients | Not “hosted”; **distributed** as binaries or via `bun run` / npm |

So you have **two deployments**:

1. **API** (includes web chat) — e.g. `https://api.agentchat.io`  
   - Serves: REST API + `GET /` and `GET /chat` (same HTML).
2. **Whitepaper** — e.g. `https://agentchat.io`  
   - Serves: landing page only. **Links** to the API for “Try the demo” (open web chat).

You do **not** need to host the web UI separately. The web UI is just `chat.html` served by the API. Users can open the web UI by visiting the API origin (e.g. `https://api.agentchat.io/chat`).

### 1.2 Whitepaper → Web UI: direct link (recommended)

- **From whitepaper:** “Try the demo” / “Open chat” should link to your **API origin + `/chat`**, e.g.  
  `https://api.agentchat.io/chat`  
  (or whatever your API base URL is).
- **No iframe required:** User leaves the whitepaper and lands on the API domain where the chat runs. Same-origin: the page’s `fetch('')` already targets the API.
- **Optional:** If you later want the chat to appear *inside* the whitepaper (same domain), you can either:
  - **iframe** to `https://api.agentchat.io/chat` (requires API to send `X-Frame-Options` and CORS that allow framing from your whitepaper domain), or
  - Build a small “chat launcher” on the whitepaper that opens `api.agentchat.io/chat` in a new tab or window.

**Concrete change:** In `apps/whitepaper/src/sections/ChatSection.tsx`, make “Try the demo” a link to the **configured API base URL** (e.g. env at build time or a config like `AGENTCHAT_API_URL`), e.g. `${API_URL}/chat`.

### 1.3 Hosting the API (web + terminal clients talk to it)

- **VPS (e.g. systemd):** Use `deploy/agentchat-api.service`; run the API with `HOST=0.0.0.0` and put nginx/Caddy in front for TLS. The API serves both REST and `chat.html`.
- **PaaS (Railway, Render, Fly.io):** Run the API as a single service; attach Postgres (or use Supabase). Same process serves API + web chat.
- **Docker:** Add a Dockerfile that runs `bun run api` and expose one port; map `/` and `/chat` to the same container (already the case in current code).

**Terminal (TUI/CLI)** doesn’t need its own host: users run `bun run tui` or `bun run cli` (or a packaged binary) and set `AGENTCHAT_API_URL=https://api.agentchat.io`. So “hosting” for terminal = **distribution** (repo, npm package, or built binaries), not a server.

### 1.4 Summary: do we host web UI separately?

- **No.** The web UI is served by the API at `/` and `/chat`.  
- **Whitepaper:** Hosted separately (e.g. Vercel) and **links** to the API’s `/chat` so users can “open the web UI” from the landing page.  
- Optional later: embeddable widget or iframe that points at the same API.

---

## 2. Making agentchat easy to integrate (MCP, API, SDK)

### 2.1 REST API (already there)

- Keep the existing REST API as the single source of truth.
- **CORS:** If you want the web chat (or a future embed) to run on a different origin (e.g. whitepaper domain), add CORS headers on the API to allow that origin.
- **API keys (optional):** For platform-to-platform integration (e.g. agentos calling agentchat on behalf of users), you can add optional API-key auth in addition to (or instead of) JWT for server-to-server calls.
- **Docs:** Keep and extend `docs/api-reference.md`; consider OpenAPI/Swagger for codegen and SDKs.

### 2.2 MCP (Model Context Protocol) server

Expose agentchat as an **MCP server** so any MCP client (Cursor, Claude Desktop, custom agents) can use it without building HTTP by hand.

- **Tools** (examples):
  - `agentchat_login` — authenticate (username/password or token), store session for subsequent tools.
  - `agentchat_send_message` — open DM and send a message.
  - `agentchat_inbox` — list conversations and unread.
  - `agentchat_get_messages` — get history for a conversation.
  - `agentchat_users` / `agentchat_presence` — list users and online status.
- **Implementation:** New package or app, e.g. `apps/mcp-server` or `packages/mcp`, that:
  - Starts an MCP server (stdio or SSE).
  - Maps MCP tool calls to your existing REST API (using the same `@agentchat/core` or HTTP client).
  - Handles auth (e.g. pass token in tool args or via a “login” tool and in-memory session).
- **Benefit:** agentos or any MCP-based agent can “use agentchat” by connecting to this MCP server; no need to implement REST in the agent.

### 2.3 SDK (client library)

- **Purpose:** Let any app (Node, browser, agentos, identityos) integrate with agentchat in a few lines of code.
- **Scope (v1):** TypeScript/JavaScript SDK that wraps the REST API:
  - Methods: `login`, `register`, `dm`, `sendMessage`, `getInbox`, `getMessages`, `markRead`, `users`, `presence`, `logout`.
  - Config: base URL, optional token (or login first).
  - Can be used from Node (CLI/TUI, bots), browser (embeds), or other runtimes.
- **Package:** e.g. `@agentchat/sdk` or `packages/sdk` in the monorepo; publish to npm.
- **Later:** Python/Go SDKs as thin wrappers over the same REST API if needed for agentos or identityos in those languages.

### 2.4 Embeddable chat widget (optional)

- A small JS snippet or React/Web Component that other sites (including whitepaper) can drop in.
- Widget loads `chat.html` in an iframe or a bundle that talks to `AGENTCHAT_API_URL` (configurable).
- Requires API to allow the parent origin in CORS (and optionally frame options if iframe).

---

## 3. Interconnection: agentchat + agentos + identityos

### 3.1 Identity (identityos)

- **Today:** agentchat has its own auth (username/password, JWT).
- **Integration option:** identityos as the **identity provider**:
  - identityos issues JWTs or OAuth2 tokens that encode user identity (e.g. `sub` = user id or username).
  - agentchat API accepts a **second auth mode**: validate identityos-issued JWT (e.g. JWKS or shared secret) and map `sub` to an agentchat user (create-on-first-use or link table).
  - agentchat can keep local register/login for “standalone” use and add “Login with identityos” or “Validate identityos token” for platform use.
- **Result:** One identity across agentos, identityos, and agentchat; users log in once (identityos) and use agentchat from agentos or from the web.

### 3.2 Agents (agentos)

- **Use case:** Agents in agentos need to send/receive DMs (e.g. human–agent or agent–agent).
- **Ways to integrate:**
  - **API:** agentos runtime calls agentchat REST API with a token (user’s or service account).
  - **MCP:** agentos runs or connects to the agentchat MCP server; agents use tools like `agentchat_send_message` and `agentchat_inbox`.
  - **SDK:** agentos (if Node/TS) uses `@agentchat/sdk` for typed, simple calls.
- **Auth:** Token from identityos (if integrated) or agentchat-native JWT; agentos obtains it on behalf of the user or bot.

### 3.3 Shared “platform contract”

To keep the three products interoperable without tight coupling:

- **Identity:** Define how “user” is represented (e.g. `sub` + optional `username`). identityos issues tokens; agentchat and agentos consume them.
- **API surface:** agentchat exposes REST (and optionally MCP); agentos and identityos call or proxy as needed.
- **Webhooks (optional):** agentchat could send webhooks on new message (or conversation) so agentos or identityos can react (e.g. notify user, trigger agent).

---

## 4. Recommended order of work

### Phase 1 – Hosting and whitepaper → web UI

1. **Deploy API** (with web chat) to one host (e.g. Railway/Render/Fly.io or VPS). Set `DATABASE_URL`, `AGENTCHAT_TOKEN_SECRET`, and optional `HOST`/`PORT`. Ensure `GET /` and `GET /chat` are public.
2. **Set whitepaper “Try the demo”** to point to `{API_BASE_URL}/chat` (configurable, e.g. env at build time).
3. **Document** the two URLs: whitepaper (e.g. `https://agentchat.io`) and API + chat (e.g. `https://api.agentchat.io/chat`).
4. **(Optional)** Add CORS on the API for the whitepaper origin if you later add an iframe or same-origin embed.

### Phase 2 – Integration surfaces

5. **CORS:** If you need browser embeds from another origin, add configurable CORS (e.g. `ALLOWED_ORIGINS`).
6. **MCP server:** Implement `apps/mcp-server` (or `packages/mcp`) with tools: login, send_message, inbox, get_messages, users/presence. Use existing REST under the hood.
7. **SDK:** Add `packages/sdk` (TypeScript), wrap all public API endpoints, publish to npm. Use it in TUI/CLI later if desired for consistency.

### Phase 3 – Platform interconnection

8. **identityos:** Add “validate identityos JWT” in agentchat (new auth path or middleware). Map `sub` to agentchat user; keep local auth for standalone.
9. **agentos:** Document “use agentchat via API or MCP”; optionally use SDK from agentos if same stack. Use identityos token when available.
10. **Contract doc:** Short doc (e.g. `docs/PLATFORM-CONTRACT.md`) describing auth shape, base URLs, and how the three products plug together.

---

## 5. Quick reference

| Question | Answer |
|----------|--------|
| Host web UI separately? | No. API serves `/` and `/chat`; one API deployment. |
| Whitepaper → open web UI? | Link from whitepaper to `{API_URL}/chat` (e.g. “Try the demo”). |
| Host TUI/CLI? | They’re clients; no server. Distribute via repo, npm, or binaries; they point at API URL. |
| Integrate agentchat into other platforms? | **API** (REST), **MCP** (server with tools), **SDK** (TS/JS client library). |
| agentos + identityos + agentchat? | identityos = IdP (tokens); agentchat accepts those tokens and exposes API/MCP; agentos uses API or MCP (and optionally SDK) for DMs. |

If you want, next steps can be: (1) add the whitepaper CTA link to `API_URL/chat`, (2) add a minimal CORS config to the API, and (3) scaffold the MCP server and SDK packages.
