import { useCallback, useEffect, useState } from "react";
import { useAgentChat } from "./useAgentChat.js";
import type { Message } from "../services/types.js";

export function useMessages(channelId: string) {
  const { client } = useAgentChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
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
  }, [client, channelId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

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
