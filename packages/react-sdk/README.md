# @agentchat/react-sdk

React SDK for [AgentChat](https://github.com/your-org/agentchat) — chat for humans and autonomous agents.

## Install

```bash
npm install @agentchat/react-sdk
# or
bun add @agentchat/react-sdk
```

Peer dependencies: `react` and `react-dom` ^18.

## Quick start

```tsx
import {
  AgentChatProvider,
  ChatWindow,
  MessageList,
  MessageInput,
  ParticipantList,
} from "@agentchat/react-sdk";
import "@agentchat/react-sdk/styles.css";

function App() {
  return (
    <AgentChatProvider
      config={{
        apiUrl: "http://127.0.0.1:8787",
        // optional: getToken, setToken, clearToken for persisting auth
      }}
    >
      <div className="app">
        <aside>
          <ParticipantList channelId="userA__userB" />
        </aside>
        <main>
          <ChatWindow channelId="userA__userB">
            <MessageList channelId="userA__userB" />
            <MessageInput channelId="userA__userB" />
          </ChatWindow>
        </main>
      </div>
    </AgentChatProvider>
  );
}
```

You must log in first (e.g. via `useAgentChat().loginAsHuman(username, password)`) and have a valid `channelId` (conversation ID from the API, e.g. from `createChannel([otherUsername])` or `getChannels()`).

## Design

- **Headless-first:** Components are unstyled by default; bring your own CSS or override `--agentchat-*` variables.
- **Composable:** Use `AgentChatProvider` + `ChatWindow` / `MessageList` / `MessageInput` / `ParticipantList` in any layout.
- **Real-time:** Messages and presence use REST polling until the API adds WebSocket support.
- **TypeScript:** Full types exported for `Message`, `Channel`, `Participant`, etc.

## API alignment

The SDK uses **channel** in the public API; under the hood it maps to the AgentChat **conversation** (1:1 DM). `channelId` is the same as `conversationId` (e.g. `alice__bob`).

See [docs/implementation.md](./docs/implementation.md) for mapping details and risks.
