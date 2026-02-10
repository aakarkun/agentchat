import {
  AgentChatProvider,
  createLocalStorageAuth,
  useAgentChat,
  useChannels,
  ChatWindow,
  MessageList,
  MessageInput,
  ParticipantList,
} from "@agentchat/react-sdk";
import "@agentchat/react-sdk/styles.css";
import { useState } from "react";

const API_URL = import.meta.env.VITE_AGENTCHAT_API_URL ?? "http://127.0.0.1:8787";
const storage = createLocalStorageAuth("basic-chat");

function LoginScreen() {
  const { loginAsHuman, loginAsAgent } = useAgentChat();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [asAgent, setAsAgent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (asAgent) await loginAsAgent(username.trim(), password);
      else await loginAsHuman(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-box">
      <h1>AgentChat</h1>
      <form onSubmit={handleSubmit}>
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <label>
          <input
            type="checkbox"
            checked={asAgent}
            onChange={(e) => setAsAgent(e.target.checked)}
          />{" "}
          Log in as agent
        </label>
        <div style={{ marginTop: "1rem" }}>
          <button type="submit" disabled={loading}>
            {loading ? "…" : "Log in"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

function ChatLayout() {
  const { logout, currentUser } = useAgentChat();
  const { channels, loading: channelsLoading, createChannel, refetch } = useChannels();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [creating, setCreating] = useState(false);

  const handleNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const to = newChatUsername.trim().toLowerCase();
    if (!to) return;
    setCreating(true);
    try {
      const ch = await createChannel(to);
      setSelectedChannelId(ch.conversationId);
      setNewChatUsername("");
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>{currentUser?.username}</strong>
          <button type="button" onClick={() => logout()} style={{ fontSize: "12px" }}>
            Log out
          </button>
        </div>
        <h3 style={{ margin: "0.5rem 0 0 0", fontSize: "14px" }}>Conversations</h3>
        {channelsLoading ? (
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Loading…</p>
        ) : (
          <ul className="channel-list">
            {channels.map((ch) => (
              <li
                key={ch.conversationId}
                className={selectedChannelId === ch.conversationId ? "active" : ""}
                onClick={() => setSelectedChannelId(ch.conversationId)}
              >
                {ch.otherUsername} {ch.unreadCount > 0 && `(${ch.unreadCount})`}
              </li>
            ))}
          </ul>
        )}
        <form className="new-chat" onSubmit={handleNewChat}>
          <input
            type="text"
            placeholder="Username to message"
            value={newChatUsername}
            onChange={(e) => setNewChatUsername(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
          />
          <button type="submit" disabled={creating || !newChatUsername.trim()}>
            New chat
          </button>
        </form>
      </aside>
      <main className="main">
        {selectedChannelId ? (
          <>
            <div className="chat-header">
              {channels.find((c) => c.conversationId === selectedChannelId)?.otherUsername ??
                selectedChannelId}
            </div>
            <div className="messages">
              <ChatWindow channelId={selectedChannelId}>
                <ParticipantList channelId={selectedChannelId} />
                <MessageList channelId={selectedChannelId} />
              </ChatWindow>
            </div>
            <div className="input-wrap">
              <MessageInput channelId={selectedChannelId} placeholder="Type a message…" />
            </div>
          </>
        ) : (
          <div style={{ padding: "2rem", color: "#6b7280" }}>
            Select a conversation or start a new chat.
          </div>
        )}
      </main>
    </div>
  );
}

function AppContent() {
  const { isConnected } = useAgentChat();
  return isConnected ? <ChatLayout /> : <LoginScreen />;
}

export default function App() {
  return (
    <AgentChatProvider
      config={{
        apiUrl: API_URL,
        getToken: storage.getToken,
        setToken: storage.setToken,
        clearToken: storage.clearToken,
        requestTimeoutMs: 20_000,
      }}
    >
      <AppContent />
    </AgentChatProvider>
  );
}
