import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import TextInput from "ink-text-input";
import {
  getUsers,
  postDm,
  getInbox,
  getMessages,
  postMessage,
  postRead,
  getUnreadCount,
  postLogout,
} from "./api.js";
import { isLineInputMode, setLineInputContext } from "./line-input.js";

const API_POLL_MS = 1200;
const INBOX_POLL_MS = 3000;

function formatMessageTime(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec / 60) + "min ago";
  if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
  if (sec < 604800) return Math.floor(sec / 86400) + "d ago";
  return new Date(ts).toLocaleDateString();
}

function wrapText(text: string, maxLen: number): string[] {
  if (maxLen <= 0 || !text) return text ? [text] : [];
  const lines: string[] = [];
  const words = text.split(/\s+/);
  let line = "";
  for (const w of words) {
    const toAdd = line ? line + " " + w : w;
    if (toAdd.length <= maxLen) {
      line = toAdd;
    } else {
      if (line) lines.push(line);
      if (w.length <= maxLen) {
        line = w;
      } else {
        for (let i = 0; i < w.length; i += maxLen) {
          lines.push(w.slice(i, i + maxLen));
        }
        line = "";
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface InboxItem {
  conversationId: string;
  otherUsername: string;
  otherUserKind?: "agent" | "human";
  lastMessageAt: number;
  lastMessagePreview: string | null;
  unreadCount: number;
  otherUserRegistered?: boolean;
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
  const { stdout } = useStdout();
  const columns = stdout?.columns ?? 80;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherUsername, setOtherUsername] = useState<string | null>(null);
  const [otherUserKind, setOtherUserKind] = useState<"agent" | "human" | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [cmdOutput, setCmdOutput] = useState<string | null>(null);
  const lastReadIdRef = useRef<number | null>(null);

  const currentOtherUnregistered =
    conversationId && otherUsername
      ? inbox.find(
          (e) => e.conversationId === conversationId && e.otherUsername === otherUsername
        )?.otherUserRegistered === false
      : false;

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
    const cid = conversationId;
    const res = await getMessages(cid, undefined, 50);
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
        await postRead(cid, maxId);
      }
    }
  }, [conversationId, onUnauthorized]);

  const fetchMessagesRef = useRef(fetchMessages);
  fetchMessagesRef.current = fetchMessages;

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
    lastReadIdRef.current = null;
    const tick = () => void fetchMessagesRef.current?.();
    tick();
    const msgInterval = setInterval(tick, API_POLL_MS);
    return () => clearInterval(msgInterval);
  }, [conversationId]);

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
      if (cmd === "/logout") {
        await postLogout();
        onUnauthorized?.();
        return;
      }
      if (cmd === "/whoami") {
        setCmdOutput("You: " + me);
        return;
      }
      if (cmd === "/new") {
        setConversationId(null);
        setOtherUsername(null);
        setOtherUserKind(null);
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
          const data = res.data as { users: Array<string | { username: string; kind?: string }> };
          const userList = (data.users ?? []).map((u) => {
            if (typeof u === "string") return `${u} (human)`;
            const name = u?.username ?? String(u);
            const kind = u?.kind === "agent" ? "agent" : "human";
            return `${name} (${kind})`;
          });
          setCmdOutput("Users: " + userList.join(", "));
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
          const d = res.data as { conversationId: string; with: string; otherUserKind?: "agent" | "human" };
          setConversationId(d.conversationId);
          setOtherUsername(d.with);
          setOtherUserKind(d.otherUserKind === "agent" || d.otherUserKind === "human" ? d.otherUserKind : null);
          setMessages([]);
          setCmdOutput(null);
        } else {
          setCmdOutput("User not found or not registered. " + (res.error ?? "Cannot start chat."));
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
            const kind = (e: InboxItem) => e.otherUserKind === "agent" || e.otherUserKind === "human" ? e.otherUserKind : "human";
            setCmdOutput(
              list
                .map(
                  (e) =>
                    `${e.otherUsername} (${kind(e)}), ${e.unreadCount} unread: ${(e.lastMessagePreview ?? "").slice(0, 40)}`
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
      setCmdOutput("Unknown command. Use: /users /dm /inbox /history /new /whoami /logout /quit");
      return;
    }

    if (!conversationId || !otherUsername) {
      setError("Select a conversation first: /dm <username>");
      return;
    }

    const currentInboxEntry = inbox.find(
      (e) => e.conversationId === conversationId && e.otherUsername === otherUsername
    );
    if (currentInboxEntry && currentInboxEntry.otherUserRegistered === false) {
      setError("This user is not registered. You cannot send messages to this account.");
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
      setError(res.error ?? "Send failed. They may no longer be registered.");
    }
  };

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;
  useEffect(() => {
    if (!isLineInputMode()) return;
    setLineInputContext({
      prompt: "^_ ",
      handle: (line) => Promise.resolve(handleSubmitRef.current(line)),
    });
    return () => setLineInputContext(null);
  }, []);

  return (
    <Box flexDirection="column" width="100%">
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text bold>
          agentchat ^_ | You: {me} | Chatting: {otherUsername ?? "-"}
          {(() => {
            const k = otherUserKind ?? inbox.find((e) => e.otherUsername === otherUsername)?.otherUserKind;
            return otherUsername && k ? <Text color="gray"> ({k})</Text> : null;
          })()}
          {" | Session: "}
          {conversationId ?? "-"} | Unread: {unreadTotal}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} minHeight={12} paddingX={1} paddingY={1}>
        {currentOtherUnregistered ? (
          <Box marginBottom={1}>
            <Text color="red" bold>
              This user is not registered. You cannot send messages to this account.
            </Text>
          </Box>
        ) : null}
        {messages.length === 0 && !cmdOutput && !error && !currentOtherUnregistered && (
          <Text dimColor>
            Use /dm &lt;username&gt; to open a chat. /inbox = list conversations. /logout = sign out. /quit = exit.
          </Text>
        )}
        {messages.map((m) => {
          const prefixLen = m.fromUser.length + m.toUser.length + 5; // " → " + ": "
          const maxLineLen = Math.max(20, columns - prefixLen - 2);
          const bodyLines = wrapText(m.body, maxLineLen);
          return (
            <Box key={m.id} flexDirection="column" marginBottom={1}>
              <Box>
                <Text bold>{m.fromUser}</Text>
                <Text> → {m.toUser}: </Text>
                <Text>{bodyLines[0] ?? ""}</Text>
              </Box>
              {bodyLines.slice(1).map((line, i) => (
                <Box key={i} paddingLeft={prefixLen}>
                  <Text>{line}</Text>
                </Box>
              ))}
              <Box>
                <Text dimColor color="gray">{formatMessageTime(m.createdAt)}</Text>
              </Box>
            </Box>
          );
        })}
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
        <Text color="cyan">^_ </Text>
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
