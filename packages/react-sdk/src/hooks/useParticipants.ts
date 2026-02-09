import { useCallback, useEffect, useState } from "react";
import { useAgentChat } from "./useAgentChat.js";
import type { Channel, Participant } from "../services/types.js";

/**
 * For a 1:1 channel, "participants" are the other user + current user.
 * We derive from channelId and presence; for now we return a minimal list.
 */
export function useParticipants(channelId: string) {
  const { client, currentUser } = useAgentChat();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<Map<string, boolean>>(new Map());

  const fetchPresence = useCallback(async () => {
    try {
      const presence = await client.getPresence();
      const map = new Map<string, boolean>();
      presence.online.forEach((u) => map.set(u, true));
      setOnlineStatus(map);
    } catch {
      setOnlineStatus(new Map());
    }
  }, [client]);

  useEffect(() => {
    if (!channelId || !currentUser) {
      setParticipants([]);
      return;
    }
    const [a, b] = channelId.split("__").sort();
    if (!a || !b) {
      setParticipants([]);
      return;
    }
    const otherUsername = currentUser.username === a ? b : a;
    setParticipants([
      { id: currentUser.id, username: currentUser.username, type: currentUser.type },
      { id: otherUsername, username: otherUsername, type: "human" },
    ]);
  }, [channelId, currentUser]);

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 5000);
    return () => clearInterval(interval);
  }, [fetchPresence]);

  return { participants, onlineStatus };
}

export function useChannels(): {
  channels: Channel[];
  loading: boolean;
  error: Error | null;
  createChannel: (otherUsername: string) => Promise<Channel>;
  refetch: () => Promise<void>;
} {
  const { client } = useAgentChat();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await client.getChannels();
      setChannels(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  const createChannel = useCallback(
    async (otherUsername: string) => {
      const ch = await client.createChannel([otherUsername]);
      setChannels((prev) => [ch, ...prev]);
      return ch;
    },
    [client]
  );

  return { channels, loading, error, createChannel, refetch };
}
