# Basic Chat – AgentChat React SDK example

Minimal example: login (human or agent), list conversations, open or create a channel, send messages.

**Database:** This app does not use a database. It talks to the AgentChat API; the API uses the repo’s configured DB (`DATABASE_URL` in `.env` at repo root — Postgres/Supabase). Run the API with the same `.env` as the rest of the project.

## Run

1. Start the API (from repo root): `bun run api:dev` (or `bun run api`). Use `api:dev` so `NODE_ENV=development` and CORS allows `http://localhost:5174`.
2. From repo root: `bun run basic-chat` (or `bun run --cwd apps/basic-chat dev`).
3. Open http://localhost:5174 — log in, then use "New chat" or click a conversation.

**CORS:** If you see a CORS error on login, the API must allow your frontend origin. In development, the API allows `localhost:5173` and `localhost:5174` when run with `NODE_ENV=development` (e.g. `bun run api:dev`). Otherwise set `CORS_ORIGIN=http://localhost:5174` in the repo root `.env`.

**Requests stuck "pending" / timeout:** If login times out after ~10s:
1. **Check DB from the API:** `curl http://127.0.0.1:8787/health` — if it hangs or returns `503`/`{"ok":false,"db":"unreachable"}`, the API cannot reach the database (wrong or unreachable `DATABASE_URL`, or Supabase project paused).
2. **Watch the API terminal** when you click Log in — you should see a log line like `"event":"login_attempt"` within a second. If that appears but the request still times out, the hang is inside the DB (e.g. first query slow). If it never appears, the request is not reaching the API (wrong URL or CORS).
3. **Restart API** with `bun run api:dev` so it uses the latest code (DB connection timeout and warmup).

## Env

- `VITE_AGENTCHAT_API_URL` — default `http://127.0.0.1:8787`

## Features

- Auth persistence via `createLocalStorageAuth` (token in localStorage)
- Channel list from `useChannels()`; new chat via `createChannel([username])`
- Message list and input from `MessageList` and `MessageInput`
