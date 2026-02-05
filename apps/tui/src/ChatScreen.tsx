import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import {
  getUsers,
  postDm,
  getInbox,
  getMessages,
  postMessage,
  postRead,
  getUnreadCount,
} from "./api.js";
import { isLineInputMode, setLineInputContext } from "./line-input.js";

const API_POLL_MS = 1500;
const INBOX_POLL_MS = 3000;

interface InboxItem {
  conversationId: string;
  otherUsername: string;
  lastMessageAt: number;
  lastMessagePreview: string | null;
  unreadCount: number;
}

interface Msg {
  id: number;
  fromUser: string;
  toUser: string;
  body: string;
  createdAt: number;
}

export function ChatScreen({
  me,
  onUnauthorized,
}: {
  me: string;
  onUnauthorized?: () => void;
}) {
  const { exit } = useApp();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherUsername, setOtherUsername] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [cmdOutput, setCmdOutput] = useState<string | null>(null);
  const lastReadIdRef = useRef<number | null>(null);

  const fetchInbox = useCallback(async () => {
    const res = await getInbox();
    if (res.status === 401) {
      onUnauthorized?.();
      return;
    }
    if (res.ok && res.data && typeof res.data === "object" && "inbox" in res.data) {
      setInbox((res.data as { inbox: InboxItem[] }).inbox);
    }
  }, [onUnauthorized]);

  const fetchUnread = useCallback(async () => {
    const res = await getUnreadCount();
    if (res.status === 401) {
      onUnauthorized?.();
      return;
    }
    if (res.ok && res.data && typeof res.data === "object" && "count" in res.data) {
      setUnreadTotal((res.data as { count: number }).count);
    }
  }, [onUnauthorized]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const res = await getMessages(conversationId, undefined, 50);
    if (res.status === 401) {
      onUnauthorized?.();
      return;
    }
    if (res.ok && res.data && typeof res.data === "object" && "messages" in res.data) {
      const list = (res.data as { messages: Msg[] }).messages;
      setMessages(list.reverse());
      const maxId = list.length ? Math.max(...list.map((m) => m.id)) : 0;
      if (maxId > 0 && (lastReadIdRef.current == null || maxId > lastReadIdRef.current)) {
        lastReadIdRef.current = maxId;
        await postRead(conversationId, maxId);
      }
    }
  }, [conversationId, onUnauthorized]);

  useEffect(() => {
    fetchInbox();
    fetchUnread();
    const inboxInterval = setInterval(() => {
      fetchInbox();
      fetchUnread();
    }, INBOX_POLL_MS);
    return () => clearInterval(inboxInterval);
  }, [fetchInbox, fetchUnread]);

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages();
    lastReadIdRef.current = null;
    const msgInterval = setInterval(fetchMessages, API_POLL_MS);
    return () => clearInterval(msgInterval);
  }, [conversationId, fetchMessages]);

  useInput((input, key) => {
    if (key.escape) exit();
  });

  const handleSubmit = async (value: string) => {
    const line = value.trim();
    setInput("");
    setError("");
    setCmdOutput(null);

    if (!line) return;

    if (line.startsWith("/")) {
      const parts = line.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(" ").trim();

      if (cmd === "/quit") {
        exit();
        return;
      }
      if (cmd === "/whoami") {
        setCmdOutput("You: " + me);
        return;
      }
      if (cmd === "/new") {
        setConversationId(null);
        setOtherUsername(null);
        setMessages([]);
        setCmdOutput("New session. Use /dm <username> to start a chat.");
        return;
      }
      if (cmd === "/users") {
        const res = await getUsers();
        if (res.status === 401) {
          onUnauthorized?.();
          return;
        }
        if (res.ok && res.data && typeof res.data === "object" && "users" in res.data) {
          const users = (res.data as { users: string[] }).users;
          setCmdOutput("Users: " + users.join(", "));
        } else {
          setCmdOutput("Failed to fetch users: " + (res.error ?? ""));
        }
        return;
      }
      if (cmd === "/dm") {
        if (!arg) {
          setCmdOutput("Usage: /dm <username>");
          return;
        }
        const to = arg.toLowerCase();
        if (to === me) {
          setCmdOutput("Cannot DM yourself.");
          return;
        }
        const res = await postDm(to);
        if (res.status === 401) {
          onUnauthorized?.();
          return;
        }
        if (res.ok && res.data && typeof res.data === "object" && "conversationId" in res.data) {
          const cid = (res.data as { conversationId: string }).conversationId;
          const withUser = (res.data as { with: string }).with;
          setConversationId(cid);
          setOtherUsername(withUser);
          setMessages([]);
          setCmdOutput(null);
        } else {
          setCmdOutput("Failed: " + (res.error ?? "Unknown"));
        }
        return;
      }
      if (cmd === "/inbox") {
        const res = await getInbox();
        if (res.status === 401) {
          onUnauthorized?.();
          return;
        }
        if (res.ok && res.data && typeof res.data === "object" && "inbox" in res.data) {
          const list = (res.data as { inbox: InboxItem[] }).inbox;
          if (list.length === 0) {
            setCmdOutput("Inbox empty. Use /dm <user> to start a chat.");
          } else {
            setCmdOutput(
              list
                .map(
                  (e) =>
                    `${e.otherUsername} (${e.unreadCount} unread): ${(e.lastMessagePreview ?? "").slice(0, 40)}`
                )
                .join("\n")
            );
          }
        } else {
          setCmdOutput("Failed to fetch inbox.");
        }
        return;
      }
      if (cmd === "/history") {
        if (!conversationId) {
          setCmdOutput("No conversation selected. Use /dm <user> first.");
          return;
        }
        fetchMessages();
        setCmdOutput("History refreshed.");
        return;
      }
      setCmdOutput("Unknown command. Use: /users /dm /inbox /history /new /whoami /quit");
      return;
    }

    if (!conversationId || !otherUsername) {
      setError("Select a conversation first: /dm <username>");
      return;
    }

    const res = await postMessage(conversationId, otherUsername, line);
    if (res.status === 401) {
      onUnauthorized?.();
      return;
    }
    if (res.ok) {
      const maxId = res.data && typeof res.data === "object" && "id" in res.data
        ? (res.data as { id: number }).id
        : 0;
      if (maxId > 0) lastReadIdRef.current = maxId;
      fetchMessages();
      fetchUnread();
    } else {
      setError(res.error ?? "Send failed");
    }
  };

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;
  useEffect(() => {
    if (!isLineInputMode()) return;
    setLineInputContext({
      prompt: "> ",
      handle: (line) => Promise.resolve(handleSubmitRef.current(line)),
    });
    return () => setLineInputContext(null);
  }, []);

  return (
    <Box flexDirection="column" width="100%">
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text bold>
          You: {me} | Chatting: {otherUsername ?? "-"} | Session:{" "}
          {conversationId ?? "-"} | Unread: {unreadTotal}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} minHeight={12} paddingX={1} paddingY={1}>
        {messages.length === 0 && !cmdOutput && !error && (
          <Text dimColor>
            Use /dm &lt;username&gt; to open a chat. /inbox = list conversations. /quit = exit.
          </Text>
        )}
        {messages.map((m) => (
          <Box key={m.id}>
            <Text color="gray">
              [{new Date(m.createdAt).toISOString().replace("T", " ").slice(0, 19)}]{" "}
            </Text>
            <Text bold>{m.fromUser}</Text>
            <Text> → {m.toUser}: </Text>
            <Text>{m.body}</Text>
          </Box>
        ))}
        {cmdOutput ? (
          <Box marginTop={1}>
            <Text color="green">{cmdOutput}</Text>
          </Box>
        ) : null}
        {error ? (
          <Box marginTop={1}>
            <Text color="red">{error}</Text>
          </Box>
        ) : null}
      </Box>
      <Box paddingX={1} paddingY={1}>
        <Text color="cyan">&gt; </Text>
        {isLineInputMode() ? (
          <Text dimColor>Message or /command (type below and press Enter)</Text>
        ) : (
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Message or /command"
          />
        )}
      </Box>
    </Box>
  );
}
