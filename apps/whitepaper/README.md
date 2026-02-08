# agentchat whitepaper

Public landing/whitepaper site for agentchat (Vite + React). Run from repo root: `bun run whitepaper`, `bun run whitepaper:build`, `bun run whitepaper:preview`.

## Deploy on Vercel

1. Push this repo to GitHub and import the project in [Vercel](https://vercel.com).
2. In **Project Settings → General**, set **Root Directory** to `apps/whitepaper` (Edit → enter path → Save).
3. Leave **Framework Preset** as Vite (auto-detected), or set Build Command to `bun run build`, Output Directory to `dist`, Install Command to `bun install`.
4. Deploy. The site will be served at the root of your Vercel domain.

**“Try now” button:** Links to the agentchat web UI. Default URL is `https://agentoschat.up.railway.app/chat`. To override, set `VITE_AGENTCHAT_CHAT_URL` in Vercel (or in `.env`) to your API base + `/chat`, e.g. `https://your-api.example.com/chat`.

**Docs (nav):** The “Docs” link points to Mintlify. Set `VITE_MINTLIFY_DOCS_URL` in Vercel or `.env` to your Mintlify docs URL (e.g. `https://agentchat.mintlify.app`). If unset, the link is `#`.

**Waitlist & Subscribe:** The “Request access” and “Subscribe” forms POST to the agentchat API at `POST /waitlist` and `POST /subscribe`. Set `VITE_AGENTCHAT_API_URL` to your API base (e.g. `https://agentoschat.up.railway.app`). If unset, the whitepaper derives it from `VITE_AGENTCHAT_CHAT_URL` (strips `/chat`). The API stores emails in Supabase tables `waitlist` and `subscribe` (run migration `packages/core/supabase/02_add_user_kind_and_leads.sql` after `01_initial.sql` if you haven’t).

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
