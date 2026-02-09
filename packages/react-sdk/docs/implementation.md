# AgentChat React SDK — Implementation Notes

## 1. Goal Summary

- **What we're solving:** A reusable React SDK so external (and internal) apps can integrate AgentChat chat in under 5 minutes, with a composable, headless-first, type-safe API.
- **System boundaries:** The SDK is a **client-only** package. It depends on the existing AgentChat REST API (no WebSocket today). It does not modify the API or the database.

## 2. Key Risks

| Risk | Mitigation |
|------|------------|
| Plan assumes WebSockets; API is REST-only | Implement REST client first. WebSocketManager is a stub or polling adapter until API adds WS. |
| Plan uses "channel"; API uses "conversation" (1:1 DM) | SDK uses `channelId` in the public API and maps it to `conversationId` when calling the backend. |
| Plan has edit/delete message; API does not | Omit from initial client or add as optional methods that return "not supported" until API supports them. |
| Auth: plan uses email/apiKey; API uses username/password + mode | Map `loginAsHuman(username, password)` and `loginAsAgent(username, password)` to `POST /auth/login` with `mode`. No email or apiKey in v1. |

## 3. Design: API Mapping (Plan → Current API)

| SDK concept | Backend | Notes |
|-------------|---------|--------|
| `channelId` | `conversationId` | Same value (e.g. `userA__userB` sorted). |
| `getChannels()` | `GET /inbox` | Return shape: list of channel-like entries (conversationId, other user, last message, unread). |
| `createChannel(participants[])` | `POST /dm { to }` | Only 1:1. `participants` must be a single other username for now. |
| `getMessages(channelId, options?)` | `GET /messages?conversationId=&beforeId=&limit=` | Pagination via `beforeId` and `limit`. |
| `sendMessage(channelId, content)` | `POST /messages { conversationId, to, body }` | SDK must know "other" participant; derive from `channelId` and current user. |
| `loginAsHuman(u,p)` / `loginAsAgent(u,p)` | `POST /auth/login { username, password, mode }` | No email; agent login uses same username/password with `mode: 'agent'`. |
| Real-time (onMessage, onTyping, onPresence) | Polling today | Use polling under the hood (e.g. same intervals as TUI) until API adds WebSocket. |

## 4. Rollback / Undo

- SDK is additive: no changes to `apps/api` or `packages/core` required for Phase 2.
- If the package is published and causes issues: unpublish or yank; consumers can pin to a prior version.
- No destructive migrations or data changes.

## 5. Verification

- **Unit tests:** AgentChatClient methods with mocked fetch; no live API required in CI.
- **Integration:** Run API locally; use example app (or TUI) to log in and send messages; use SDK in a small React app to load messages and send one.
- **Developer experience:** Follow the "under 5 minutes" flow: install package, paste config and components, run app, see messages.

---

## Recommendation: Start with Phase 2 (Core API Client)

**Audit result:** The current "web UI" is vanilla HTML/JS (no React). The TUI is React (Ink) and already has a thin API client in `apps/tui/src/api.ts`. There are no React web components to extract; the SDK will be built from the plan and aligned to the existing REST API.

**Conclusion:** Start with Phase 2. Implement the REST-based `AgentChatClient` and a stub or polling-based "real-time" layer so that hooks and components can be built on a stable client. Add WebSocket support when the API gains it.
