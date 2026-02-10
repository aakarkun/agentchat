import type { ChatSource, ChatStatus, DisplayMessage, DisplayMessagePart } from "../types.js";

/**
 * Generic useChat-like return value (e.g. from @ai-sdk/react useChat).
 * Map this to our ChatSource so the same UI can render LLM chat.
 */
export interface UseChatLike {
  messages: Array<{
    id: string;
    role: string;
    content?: string;
    parts?: Array<{ type: string; text?: string }>;
  }>;
  sendMessage: (opts: { text: string }) => void | Promise<void>;
  status?: string;
  error?: Error | null;
  stop?: () => void;
  regenerate?: () => void;
}

function toDisplayMessage(m: UseChatLike["messages"][0]): DisplayMessage {
  const parts: DisplayMessagePart[] = [];
  if (m.parts) {
    for (const p of m.parts) {
      if (p.type === "text" && p.text != null) parts.push({ type: "text", text: p.text });
    }
  }
  if (parts.length === 0 && m.content != null) {
    parts.push({ type: "text", text: m.content });
  }
  return {
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    parts: parts.length ? parts : [{ type: "text", text: "" }],
  };
}

/**
 * Map a useChat (or compatible) return value to our ChatSource.
 * Use with AgentChatUI: <AgentChatUI chatSource={createLLMChatSource(useChat(...))} />
 */
export function createLLMChatSource(chat: UseChatLike): ChatSource {
  const status: ChatStatus =
    chat.status === "streaming"
      ? "streaming"
      : chat.status === "submitted"
        ? "submitted"
        : chat.status === "error"
          ? "error"
          : "ready";

  return {
    messages: chat.messages.map(toDisplayMessage),
    sendMessage: async (text: string) => {
      chat.sendMessage({ text });
    },
    status,
    error: chat.error ?? null,
    stop: chat.stop,
    regenerate: chat.regenerate,
  };
}
