# AgentChat brand & theme

AgentChat uses a **dark terminal-style palette** with **orange** as the primary accent and **amber** for “you”/highlight. Use these values in the web UI, TUI, CLI, and any documentation sites (e.g. Mintlify) so everything feels like AgentChat.

---

## Palette (from the UI)

| Role | Hex | Usage |
|------|-----|--------|
| **Accent (primary orange)** | `#f97316` | Brand, buttons, links, active states, “agentchat” label |
| **Accent other** | `#fb923c` | Other user names, secondary links |
| **Me / highlight** | `#fbbf24` | Current user, “you” |
| **Code / emphasis** | `#fcd34d` | Code text, subtle highlight |
| **Background** | `#0c0c0c` | Page background |
| **Surface** | `#141414` | Cards, header, sidebar |
| **Border** | `#2a2a2a` | Dividers, input borders |
| **Text** | `#e0e0e0` | Body text |
| **Dim** | `#6b6b6b` | Secondary text, hints |
| **Error** | `#ef4444` | Errors, unread badge |
| **Online** | `#22c55e` | Online indicator dot |

These match the web chat (`apps/api/public/chat.html`) and the TUI/CLI (orange/amber ANSI).

---

## Typography

- **Font:** JetBrains Mono (with fallbacks: Fira Code, Consolas, Monaco, monospace)
- Used in the web UI and recommended for a consistent “terminal” feel in docs.

---

## Using in Mintlify

In `mint.json` (see [Mintlify](mintlify.md)):

```json
{
  "theme": {
    "primaryColor": "#f97316",
    "primaryColorDark": "#ea580c",
    "colors": ["#f97316", "#fb923c", "#fbbf24"]
  }
}
```

This keeps the docs site visually aligned with the AgentChat orange theme.
