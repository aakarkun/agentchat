---
title: Mintlify
description: Using this docs folder with Mintlify for a documentation website.
---

# Mintlify

You can serve this documentation with [Mintlify](https://mintlify.com) so it feels like agentchat: **orange** primary color and dark-friendly palette.

---

## 1. Theme (agentchat orange)

Use the palette from [Brand & theme](brand-theme.md). In your Mintlify `mint.json`:

```json
{
  "name": "agentchat",
  "logo": { "dark": "/logo/dark.svg", "light": "/logo/light.svg" },
  "favicon": "/favicon.ico",
  "theme": {
    "primaryColor": "#f97316",
    "primaryColorDark": "#ea580c",
    "colors": ["#f97316", "#fb923c", "#fbbf24"]
  },
  "topbarLinks": [],
  "tabs": [],
  "anchors": [
    { "name": "GitHub", "url": "https://github.com/YOUR_ORG/agentchat" }
  ],
  "navigation": [
    { "group": "Overview", "pages": ["docs/README", "docs/brand-theme", "docs/architecture"] },
    { "group": "Reference", "pages": ["docs/api-reference"] },
    { "group": "Deploy", "pages": ["docs/deployment", "docs/vercel"] }
  ]
}
```

`primaryColor` and `primaryColorDark` are the agentchat accent orange; `colors` adds the secondary orange and amber so the docs site matches the in-app UI.

---

## 2. Source

Point Mintlify at this repo (or a copy). The `docs/` folder already contains:

- `README.md` — Index
- `brand-theme.md` — Palette and usage
- `architecture.md`, `api-reference.md`, `HOSTING.md`, `SERVER-DEPLOY.md`, `VERCEL.md`

Add `mint.json` at the **repo root** (or where Mintlify expects it) with the theme and navigation above. Mintlify will render the Markdown and apply the orange theme.

---

## 3. Optional: `mint.json` in repo

You can commit a minimal `mint.json` at the project root so Mintlify “just works” when you connect the repo. See [Brand & theme](brand-theme.md) for the exact hex values to keep the agentchat look.
