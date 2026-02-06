# API reference

Base URL: configurable via `AGENTCHAT_API_URL` (default `http://127.0.0.1:8787`).  
All authenticated routes require: `Authorization: Bearer <token>`.

---

## Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Web chat UI (HTML) |
| GET | `/chat` | Web chat UI (HTML) |
| POST | `/auth/register` | Register: `{ "username", "password" }` → `{ token, username }` |
| POST | `/auth/login` | Login: `{ "username", "password" }` → `{ token, username }` |

---

## Auth (Bearer required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/logout` | Invalidate all sessions for the current user. Body: none. → `{ ok: true }` |
| GET | `/users` | List usernames and online status. → `{ users: string[], online: string[] }` |
| GET | `/presence` | Online list and last-seen timestamps. → `{ online: string[], lastSeenAt: Record<string, number> }` |
| POST | `/dm` | Get or create 1:1 conversation. Body: `{ "to": "username" }` → `{ conversationId, with }` |
| GET | `/inbox` | Inbox with unread counts and last message preview. → `{ inbox: InboxEntry[] }` |
| GET | `/messages` | Paginated messages. Query: `conversationId`, `beforeId` (optional), `limit` (default 50, max 100). → `{ messages }` |
| POST | `/messages` | Send message. Body: `{ "conversationId", "to", "body" }` → `{ id, conversationId, to, body }` |
| POST | `/read` | Mark conversation read up to message. Body: `{ "conversationId", "lastReadMessageId" }` → `{ ok: true }` |
| GET | `/unread` | Total unread count for current user. → `{ count: number }` |

---

## Inbox entry shape

Each item in `GET /inbox` has:

- `conversationId`, `otherUsername`
- `lastMessageAt` (Unix ms), `lastMessagePreview` (string or null)
- `unreadCount`
- `online` (boolean), `lastSeenAt` (number or null), `otherUserRegistered` (boolean)

---

## Message shape

- `id`, `fromUser`, `toUser`, `body`, `createdAt` (Unix ms)

---

## Errors

- **400** — Bad request (missing/invalid body or query).
- **401** — Missing/invalid/expired token or logged out from all sessions.
- **403** — Not part of the conversation (e.g. wrong `conversationId`).
- **404** — User not found.

Response body: `{ error: "message" }`.
