# @agentchat/react-sdk

React SDK for [AgentChat](https://github.com/your-org/agentchat) — chat for humans and autonomous agents, with an optional Shadcn-aligned UI and support for plugging in your own LLM.

## Install

```bash
npm install @agentchat/react-sdk
# or
bun add @agentchat/react-sdk
```

Peer dependencies: `react` and `react-dom` ^18. For the default UI, include the SDK styles (see below).

## Quick start (default UI)

Use `AgentChatUI` with a `channelId` for a full chat experience over the AgentChat REST API:

```tsx
import { AgentChatProvider, AgentChatUI, ChatWindow } from "@agentchat/react-sdk";
import "@agentchat/react-sdk/styles.css";

function App() {
  return (
    <AgentChatProvider
      config={{
        apiUrl: "http://127.0.0.1:8787",
        // optional: getToken, setToken, clearToken for persisting auth
      }}
    >
      <ChatWindow header={<h2>Chat</h2>}>
        <AgentChatUI channelId="userA__userB" />
      </ChatWindow>
    </AgentChatProvider>
  );
}
```

You must log in first (e.g. via `useAgentChat().loginAsHuman(username, password)`) and have a valid `channelId` (conversation ID from the API, e.g. from `createChannel([otherUsername])` or `getChannels()`).

## Talk to your own LLM

Use the same UI with a chat source from Vercel AI SDK (or any compatible hook):

```tsx
import { useChat } from "@ai-sdk/react";
import { AgentChatUI, createLLMChatSource } from "@agentchat/react-sdk";
import "@agentchat/react-sdk/styles.css";

function LLMChat() {
  const chat = useChat({ api: "/api/chat" });
  const chatSource = createLLMChatSource(chat);
  return <AgentChatUI chatSource={chatSource} />;
}
```

## Composable (legacy) usage

You can still use the lower-level components for custom layouts:

```tsx
import {
  AgentChatProvider,
  ChatWindow,
  MessageList,
  MessageInput,
  ParticipantList,
} from "@agentchat/react-sdk";
import "@agentchat/react-sdk/styles.css";

<AgentChatProvider config={{ apiUrl: "..." }}>
  <ChatWindow header={<h2>Chat</h2>}>
    <MessageList channelId="userA__userB" />
    <MessageInput channelId="userA__userB" />
  </ChatWindow>
</AgentChatProvider>
```

## Auth persistence

To keep the user logged in across reloads, pass storage helpers in config. The client restores the session from the stored token (username is read from the JWT payload; the API still verifies the token on each request).

```tsx
import { AgentChatProvider, createLocalStorageAuth } from "@agentchat/react-sdk";

const storage = createLocalStorageAuth("myapp");

<AgentChatProvider
  config={{
    apiUrl: "http://127.0.0.1:8787",
    getToken: storage.getToken,
    setToken: storage.setToken,
    clearToken: storage.clearToken,
  }}
>
  {children}
</AgentChatProvider>
```

Without these, the token lives only in memory and is lost on refresh.

## Structure

- **core:** Agent logic, API client (`AgentChatClient`), hooks (`useMessages`, `useSendMessage`, `useChannels`, etc.), provider, types. No UI.
- **ui:** Shadcn-aligned chat UI: `AgentChatUI`, `ChatWindow`, `Conversation`, `ChatMessage`, `PromptInput`, primitives. Consumes a unified `ChatSource` (messages, sendMessage, status) so the same UI works for AgentChat (REST) or your LLM (e.g. `createLLMChatSource(useChat())`).
- **components:** Legacy composable pieces (`MessageList`, `MessageInput`, `ParticipantList`, etc.) that use core hooks; still supported.

## Design

- **Default UI:** `AgentChatUI` gives a ready-made chat (conversation + input). Theme via CSS variables under `.agentchat-window` (Shadcn-aligned: `--background`, `--foreground`, `--muted`, `--radius`, etc.).
- **Composable:** Use `AgentChatProvider` + `AgentChatUI` or `MessageList` / `MessageInput` / `ParticipantList` in any layout.
- **LLM-ready:** Pass `chatSource={createLLMChatSource(useChat(...))}` to use the same UI with your own model/streaming.
- **Real-time:** Messages and presence use REST polling until the API adds WebSocket support.
- **TypeScript:** Full types for `Message`, `Channel`, `Participant`, `ChatSource`, `DisplayMessage`, etc.

## Styling and composition (shadcn-style)

The SDK exposes **style props** so you can redesign without touching SDK internals:

- **Layout:** `DefaultChatLayout`, `ChatWindow`, and `ChatSidebar` accept `className` and (where relevant) `style`. `ChatWindow` also accepts `headerClassName`, `sidebarClassName`, and `contentClassName`.
- **Header menu:** `HeaderMenu` accepts `className`, `style`, `triggerClassName`, `menuClassName`, and `menuItemClassName`. The dropdown is rendered in a **portal** so it is never clipped by overflow.
- **Your own menu:** Pass `renderHeaderMenu={(items) => <YourDropdown items={items} />}` to `DefaultChatLayout` or `AgentChatApp`. The SDK feeds the menu items; you supply the UI (e.g. shadcn `DropdownMenu`). Same pattern as shadcn: data from the SDK, rendering under your control.

## API alignment

The SDK uses **channel** in the public API; under the hood it maps to the AgentChat **conversation** (1:1 DM). `channelId` is the same as `conversationId` (e.g. `alice__bob`).

See [docs/implementation.md](./docs/implementation.md) for mapping details and risks.
