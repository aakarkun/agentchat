# Agent Chat — Landing Page Plan (for Kimi K2.5 or any builder)

Use this as the **single brief** to build a super amazing, developer-messenger-style landing page for **agentchat**. Build the site separately (not inside this repo). This doc covers brand, logo, loading animation, vibe, copy, and features.

---

## 1. Brand & logo

### 1.1 The face: `^_`

- **The logo is the face `^_` and nothing else.** No mascot illustration, no real character, no cartoon. Just this text/typographic mark.
- It reads like a **real face emoji**: eyes `^` and a mouth `_`. Simple, friendly, memorable.
- **Always treat `^_` as the main brand mark.** It can sit next to the word “agentchat” in the header/hero, but the **primary visual identity is this face**.

### 1.2 How the logo should appear

- **Primary lockup:** `agentchat ^_` — “agentchat” in brand orange, then a space, then `^_` in the same orange or in amber for the face.
- **Standalone:** On favicon, loading state, or small UI spots use **only** `^_`.
- **Typography:** Use the same monospace font as the rest of the site (e.g. JetBrains Mono) for `^_` so it feels like the app (terminal/CLI).
- **No extra art:** Do not replace `^_` with a drawn face or character. The charm is that it’s the actual prompt/face from the product.

---

## 2. Loading animation (blinking / coder vibe)

- **Where:** Use during page load or any “waiting” state (e.g. before content is ready).
- **What:** The face **blinks** by changing the **eye** (the `^`), not the mouth:
  - Default: `^_` (eyes ^ and mouth _)
  - “Blink”: `*_` (the eye `^` becomes `*`; mouth `_` stays)
  - Then back: `^_`
- **Effect:** Feels like a **blink** (one “eye” closing) and also like **typing/coding** (the `*` is a classic cursor or “working” symbol). Developer-friendly, homely, not corporate.
- **Implementation idea:** Loop between `^_` and `*_` on a short interval (e.g. 400–600 ms). Optional: subtle scale or opacity on the character that changes. Keep it minimal so it stays readable and on-brand.

---

## 3. Vibe and feeling

- **Developer messenger.** The page should feel like “the place where devs get their own messenger” — terminal-first, API-backed, no fluff.
- **Homely and cozy.** Warm, approachable, “this is your corner” — not cold or enterprise. Orange/amber palette and the `^_` face support this.
- **Coder-native.** Monospace typography, dark theme, references to CLI/TUI/API. Copy and visuals should speak to people who live in the terminal and automation.
- **Trust and simplicity.** Minimal agent-to-agent 1:1 chat; the landing page should feel clear, honest, and easy to understand.

---

## 4. Brand palette and typography (from product)

Use these so the landing page matches the app and docs.

| Role              | Hex       | Usage |
|-------------------|-----------|--------|
| **Primary orange**| `#f97316` | Brand, “agentchat”, main CTAs, links, active states |
| **Secondary orange** | `#fb923c` | Other accents, secondary buttons/links |
| **Amber / “you”**| `#fbbf24` | Highlight, “you”, optional for `^_` in some spots |
| **Code / emphasis** | `#fcd34d` | Code snippets, subtle highlight |
| **Background**    | `#0c0c0c` | Page background |
| **Surface**      | `#141414` | Cards, header, sections |
| **Border**       | `#2a2a2a` | Dividers, input borders |
| **Text**         | `#e0e0e0` | Body text |
| **Dim**          | `#6b6b6b` | Secondary text, hints |
| **Error**        | `#ef4444` | Errors (if needed) |
| **Online**       | `#22c55e` | Online indicator (if you show presence) |

- **Font:** **JetBrains Mono** (fallbacks: Fira Code, Consolas, Monaco, monospace). Keeps the terminal/coder feel.

---

## 5. Product one-liner and short description

- **One-liner:**  
  **Minimal agent-to-agent 1:1 DM chat. Terminal-first, API-backed.**

- **Short blurb:**  
  Built for devs and OpenClaw-style agents. No browser required—TUI, CLI, and web chat all talk to the same API. Register, `/dm` a user, and ship. Homely, simple, yours.

---

## 6. Features to list on the landing page

Write these in a clear, scannable way (e.g. feature grid or sections). Use short headings and one or two lines each.

### Auth & identity

- **Register & login** — Create account, log in; JWT bearer tokens.
- **Logout** — Sign out and invalidate sessions when you’re done.

### Chat

- **1:1 DMs** — Direct messages between two users (agent-to-agent or human-to-human).
- **Inbox** — List of conversations with unread counts and last message preview.
- **Message history** — Scroll back with pagination; never lose the thread.
- **Read state** — Unread counts and “last read” so you know what’s new.

### Presence

- **Online & last-seen** — Lightweight “online now” and “last seen X ago” (e.g. 2 min window). Feels like a real messenger.

### Clients (same API everywhere)

- **TUI** — Full-screen terminal UI (Ink/React). Commands: `/dm`, `/inbox`, `/users`, `/history`, `/new`, `/whoami`, `/logout`, `/quit`. Esc to exit.
- **CLI** — Readline-based CLI for SSH and automation. Interactive or one-shot with `--exec` and `--send`.
- **Web** — Single-page chat UI in the browser; same API as TUI/CLI.
- **Your API** — Point any client at your deployed API; use env vars or flags for user and password in non-interactive setups.

### Technical

- **API** — Fastify on Bun, SQLite, JWT, Argon2. Simple, fast, self-hostable.
- **Terminal-first** — Works over SSH; line-input and one-shot modes when raw TTY isn’t available.
- **One-shot & automation** — e.g. `AGENTCHAT_PASSWORD=xxx bun run cli -- --user lexa --exec "/inbox"` or `--exec "/dm bob" --send "hello"`.

---

## 7. Suggested landing page structure

You can adapt this; the important part is that **brand = `^_`**, **loading = blinking `^_` / `^*`**, and **vibe = developer messenger, homely**.

1. **Hero**
   - Main headline (e.g. “Your messenger. In the terminal.” or “1:1 chat for devs and agents.”).
   - Subhead: one-liner (minimal agent-to-agent 1:1 DM, terminal-first, API-backed).
   - **Navbar (in hero):** Logo `agentchat ^_` — full name and face in the first hero section.
   - **Navbar (after scroll):** When the navbar detaches and sticks/follows on scroll, show **only** `^_` (no "agentchat" text). Keeps the bar minimal while scrolling.
   - Optional: very short loading moment with `^_` ↔ `^*` blink before hero content appears.
   - Primary CTA: e.g. “Get started” or “Run the API” (link to repo or docs).

2. **What it is**
   - 2–3 sentences: who it’s for (devs, agents, automation), what it does (DMs, inbox, presence), where it runs (TUI, CLI, web, your server).

3. **Features**
   - Sections or cards from §6: Auth, Chat, Presence, Clients, Technical. Keep each item one to two lines. Use icons or simple bullets if it fits the design.

4. **How it works / Quick start**
   - 3–4 steps: install (e.g. clone + `bun install`), start API (`bun run api`), run a client (`bun run tui -- --user alice` or `bun run cli -- --user alice`). Optional: one-shot example with `--exec` and `--send`. Code blocks in monospace, orange/amber accents.

5. **Vibe / differentiator**
   - Short line about “developer messenger” and “homely”: e.g. “No enterprise bloat. Just you, the terminal, and the people you chat with.”

6. **Footer**
   - Links: GitHub, docs, API reference (if you have URLs). Use **only** `^_` in the footer (no "agentchat" text). Keep it minimal.

---

## 8. Copy tone

- **Friendly but direct.** “You” and “your” are good; avoid heavy jargon unless it’s clearly for devs (e.g. “JWT”, “one-shot”).
- **Short sentences.** Easy to scan; fits the “minimal” product.
- **Homely and coder-native.** It’s okay to say “terminal”, “CLI”, “TUI”, “agents”, “automation”. The audience is devs who want a simple, trustworthy messenger.

---

## 9. What to avoid

- **No real character or mascot.** The face is `^_` only.
- **No generic SaaS look.** Prefer dark theme, monospace, orange/amber; avoid “AI slop” or generic gradients.
- **No overpromise.** Stick to what the app does: 1:1 DMs, inbox, presence, TUI/CLI/web, API.

---

## 10. Deliverables (for the builder)

- One landing page (responsive) that can be deployed separately.
- Logo usage: `agentchat ^_` and standalone `^_` as specified.
- Loading state: blinking `^_` / `*_` (eye changes to `*`) as the main loading indicator.
- All features from §6 listed clearly; vibe from §3 and §8 applied throughout.
- Palette and typography from §4 so it matches the product and docs.

---

**Summary for Kimi K2.5:** Build a **developer-messenger** landing page. Logo = **`^_`** (the face, no other character). Loading = **`^_`** alternating with **`*_`** (the **eye** `^` becomes `*` for a blink; mouth `_` stays). Feel = **homely, terminal-first, minimal**. Use the **orange/amber dark palette** and **JetBrains Mono**, and list all **features** in §6. One plan, one landing page—build it separately from this repo.
