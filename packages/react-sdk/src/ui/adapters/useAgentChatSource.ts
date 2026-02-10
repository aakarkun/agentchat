import { useCallback, useMemo } from "react";
import { useAgentChat } from "../../core/index.js";
import { useMessages } from "../../core/index.js";
import { messagesToDisplayMessages } from "./messageAdapter.js";
import type { ChatSource, ChatStatus } from "../types.js";

/**
 * Build a ChatSource from AgentChat core hooks for the given channelId.
 * Use this when rendering AgentChatUI in "channel" mode (AgentChat REST).
 */
export function useAgentChatSource(channelId: string): ChatSource {
  const { currentUser } = useAgentChat();
  const { messages, loading, error, sendMessage } = useMessages(channelId);
  const currentUsername = currentUser?.username ?? null;

  const displayMessages = useMemo(
    () => messagesToDisplayMessages(messages, currentUsername),
    [messages, currentUsername]
  );

  const status: ChatStatus = loading ? "submitted" : error ? "error" : "ready";

  const send = useCallback(
    async (text: string) => {
      await sendMessage(text);
    },
    [sendMessage]
  );

  return {
    messages: displayMessages,
    sendMessage: send,
    status,
    error: error ?? null,
  };
}
