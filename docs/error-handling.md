# Error handling in the AgentChat React SDK

All high-level methods on `AgentChatClient` throw a typed `AgentChatError` on failure. This gives SDK consumers a single, consistent surface for inspecting HTTP, auth, and network problems.

## AgentChatError structure

```ts
class AgentChatError extends Error {
  code: string;      // e.g. 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'SERVER_ERROR'
  status: number;    // HTTP status code; 0 for network/timeout failures
  message: string;   // Human-readable error message
  details?: unknown; // Optional additional context
}
```

### Common error codes

- `UNAUTHORIZED` (401) – invalid or missing credentials
- `FORBIDDEN` (403) – authenticated, but not allowed to perform the action
- `NOT_FOUND` (404) – resource does not exist
- `SERVER_ERROR` (5xx) – backend error
- `NETWORK_ERROR` (status 0) – connection failure, DNS issue, or timeout
- `HTTP_ERROR` – non-success HTTP status that does not fall into the above buckets
- `VALIDATION_ERROR` (400) – client-side validation failure before calling the API

Helper predicates:

- `AgentChatError.isAuthError(error)` – true for 401/403
- `AgentChatError.isNetworkError(error)` – true for network/timeout failures

## Basic usage

```ts
import {
  AgentChatClient,
  AgentChatError,
} from "@agentchat/react-sdk/core";

const client = new AgentChatClient({ apiUrl: "http://127.0.0.1:8787" });

try {
  await client.loginAsHuman("alice", "password");
} catch (err) {
  if (err instanceof AgentChatError) {
    console.error(`Login failed [${err.code}]`, err.message);
  } else {
    console.error("Unexpected error", err);
  }
}
```

## Branching on error type

```ts
try {
  const messages = await client.getMessages(conversationId);
  // ...
} catch (err) {
  if (AgentChatError.isAuthError(err)) {
    // e.g. token expired – redirect to login
    redirectToLogin();
  } else if (AgentChatError.isNetworkError(err)) {
    // Show retry UI
    showNetworkProblem();
  } else if (err instanceof AgentChatError) {
    // Generic, but still typed HTTP error
    showError(err.message);
  } else {
    // Fallback for truly unexpected exceptions
    showError("Unexpected error");
  }
}
```

## In React hooks (for Phase 2)

Hooks should store `AgentChatError | null` in state so that UIs can inspect codes:

```ts
import { useState, useCallback } from "react";
import { AgentChatError } from "@agentchat/react-sdk/core";

function useMessages(conversationId: string) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AgentChatError | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await client.getMessages(conversationId);
      setMessages(list);
    } catch (err) {
      if (err instanceof AgentChatError) {
        setError(err);
      } else {
        setError(AgentChatError.fromFetchError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  return { messages, loading, error, refetch: fetchMessages };
}
```

