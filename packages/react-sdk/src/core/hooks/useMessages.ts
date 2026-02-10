import { useCallback, useEffect, useRef, useState } from "react";
import { useAgentChat } from "./useAgentChat.js";
import type { Message } from "../types.js";

const MESSAGE_POLL_MS = 10_000;

export function useMessages(channelId: string) {
  const { client } = useAgentChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(
    async (backgroundRefresh = false) => {
      if (!channelId) {
        setMessages([]);
        setLoading(false);
        return;
      }
      if (!backgroundRefresh) {
        setLoading(true);
        setError(null);
      }
      try {
        const list = await client.getMessages(channelId, { limit: 50 });
        setMessages(list.reverse());
        const maxId = list.length ? Math.max(...list.map((m) => m.id)) : 0;
        if (maxId > 0) await client.markRead(channelId, maxId);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [client, channelId]
  );

  const fetchRef = useRef(fetchMessages);
  fetchRef.current = fetchMessages;

  useEffect(() => {
    if (!channelId) return;
    fetchRef.current();
    const interval = setInterval(() => fetchRef.current(true), MESSAGE_POLL_MS);
    return () => clearInterval(interval);
  }, [channelId]);

  const sendMessage = useCallback(
    async (content: string) => {
      setError(null);
      const msg = await client.sendMessage(channelId, content);
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [client, channelId]
  );

  return { messages, loading, error, sendMessage, refetch: fetchMessages };
}

/** Send-only hook: no polling. Use in MessageInput to avoid duplicate GET /messages. */
export function useSendMessage(channelId: string) {
  const { client } = useAgentChat();
  const sendMessage = useCallback(
    async (content: string) => {
      return client.sendMessage(channelId, content);
    },
    [client, channelId]
  );
  return { sendMessage };
}
