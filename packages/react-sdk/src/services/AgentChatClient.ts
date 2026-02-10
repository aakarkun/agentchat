import type {
  AuthToken,
  Channel,
  Message,
  PaginationOptions,
  PresenceEvent,
  TypingEvent,
} from "./types.js";
import type { UnsubscribeFn } from "./types.js";
import { WebSocketManager } from "./WebSocketManager.js";

const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;

export interface AgentChatConfig {
  apiUrl: string;
  wsUrl?: string;
  getToken?: () => string | null;
  setToken?: (token: string) => void;
  clearToken?: () => void;
  /** Request timeout in ms; default 20000. Prevents infinite "pending" when API or DB is not responding. */
  requestTimeoutMs?: number;
}

const DEFAULT_GET_TOKEN = (): string | null => null;
const DEFAULT_SET_TOKEN = (_: string): void => {};
const DEFAULT_CLEAR_TOKEN = (): void => {};

/** Decode JWT payload without verification (API verifies on each request). Returns username for session restore. */
function decodeTokenPayload(token: string): { username: string } | null {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const b64 = token.slice(0, idx).replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  try {
    const json = globalThis.atob(padded);
    const payload = JSON.parse(json) as { username?: string };
    return typeof payload.username === "string" ? { username: payload.username } : null;
  } catch {
    return null;
  }
}

/**
 * Core API client for AgentChat. REST-only today; WebSocketManager is a stub.
 * channelId is synonymous with conversationId (1:1 DM).
 */
export class AgentChatClient {
  private baseUrl: string;
  private token: string | null = null;
  private username: string | null = null;
  private getToken: () => string | null;
  private setToken: (token: string) => void;
  private clearToken: () => void;
  private requestTimeoutMs: number;
  readonly ws: WebSocketManager;

  constructor(config: AgentChatConfig) {
    this.baseUrl = config.apiUrl.replace(/\/$/, "");
    this.getToken = config.getToken ?? DEFAULT_GET_TOKEN;
    this.setToken = config.setToken ?? DEFAULT_SET_TOKEN;
    this.clearToken = config.clearToken ?? DEFAULT_CLEAR_TOKEN;
    this.requestTimeoutMs = config.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    this.ws = new WebSocketManager();
    if (config.wsUrl) {
      this.ws.connect(config.wsUrl);
    }
    this.token = this.getToken();
    if (this.token) {
      const payload = decodeTokenPayload(this.token);
      if (payload) this.username = payload.username;
    }
  }

  private async request<T>(
    path: string,
    options: { method?: string; headers?: Record<string, string>; body?: object } = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const token = this.token ?? this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const body =
      options.body !== undefined ? JSON.stringify(options.body) : undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const res = await fetch(this.baseUrl + path, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({})) as T & { error?: string };
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          data,
          error: (data as { error?: string }).error ?? res.statusText,
        };
      }
      return { ok: true, status: res.status, data };
    } catch (e) {
      clearTimeout(timeoutId);
      const isAbort = e instanceof Error && e.name === "AbortError";
      return {
        ok: false,
        status: 0,
        error: isAbort
          ? `Request timed out after ${this.requestTimeoutMs / 1000}s. Restart the API (bun run api:dev), then try: curl http://127.0.0.1:8787/health — if that fails, fix DATABASE_URL in the API .env.`
          : e instanceof Error ? e.message : "Network error",
      };
    }
  }

  private setAuth(token: string, username: string): void {
    this.token = token;
    this.username = username;
    this.setToken(token);
  }

  private clearAuth(): void {
    this.token = null;
    this.username = null;
    this.clearToken();
    this.ws.disconnect();
  }

  /** Login as a human user. Uses username/password (API has no email login). */
  async loginAsHuman(username: string, password: string): Promise<AuthToken> {
    const res = await this.request<{ token: string; username: string; kind: string }>(
      "/auth/login",
      { method: "POST", body: { username, password, mode: "human" } }
    );
    if (!res.ok || !res.data) {
      throw new Error(res.error ?? "Login failed");
    }
    const { token, username: u, kind } = res.data;
    this.setAuth(token, u);
    return { token, username: u, kind: kind as "human" | "agent" };
  }

  /** Login as an agent. Uses username/password (API uses same auth with mode). */
  async loginAsAgent(username: string, password: string): Promise<AuthToken> {
    const res = await this.request<{ token: string; username: string; kind: string }>(
      "/auth/login",
      { method: "POST", body: { username, password, mode: "agent" } }
    );
    if (!res.ok || !res.data) {
      throw new Error(res.error ?? "Login failed");
    }
    const { token, username: u, kind } = res.data;
    this.setAuth(token, u);
    return { token, username: u, kind: kind as "human" | "agent" };
  }

  async logout(): Promise<void> {
    await this.request("/logout", { method: "POST" });
    this.clearAuth();
  }

  /** Get current username (from last login). */
  getCurrentUsername(): string | null {
    return this.username;
  }

  /** List channels (conversations). Maps from GET /inbox. */
  async getChannels(): Promise<Channel[]> {
    const res = await this.request<{
      inbox: Array<{
        conversationId: string;
        otherUsername: string;
        otherUserKind?: string;
        lastMessageAt: number;
        lastMessagePreview: string | null;
        unreadCount: number;
        online?: boolean;
        lastSeenAt?: number | null;
      }>;
    }>("/inbox");
    if (!res.ok || !res.data?.inbox) {
      throw new Error(res.error ?? "Failed to fetch channels");
    }
    return res.data.inbox.map((e) => ({
      id: e.conversationId,
      conversationId: e.conversationId,
      otherUsername: e.otherUsername,
      otherUserKind: (e.otherUserKind === "agent" ? "agent" : "human") as "agent" | "human",
      lastMessageAt: e.lastMessageAt,
      lastMessagePreview: e.lastMessagePreview,
      unreadCount: e.unreadCount,
      online: e.online,
      lastSeenAt: e.lastSeenAt ?? null,
    }));
  }

  /**
   * Create or get a 1:1 channel. API only supports DM with one other user.
   * participants[0] = the other username.
   */
  async createChannel(participants: string[]): Promise<Channel> {
    const to = participants[0]?.trim().toLowerCase();
    if (!to) throw new Error("At least one participant (other username) required");
    const res = await this.request<{
      conversationId: string;
      with: string;
      otherUserKind?: string;
    }>("/dm", { method: "POST", body: { to } });
    if (!res.ok || !res.data) {
      throw new Error(res.error ?? "Failed to create channel");
    }
    const d = res.data;
    return {
      id: d.conversationId,
      conversationId: d.conversationId,
      otherUsername: d.with,
      otherUserKind: (d.otherUserKind === "agent" ? "agent" : "human") as "agent" | "human",
      lastMessageAt: 0,
      lastMessagePreview: null,
      unreadCount: 0,
    };
  }

  /** Get messages for a channel (conversationId). */
  async getMessages(
    channelId: string,
    options?: PaginationOptions
  ): Promise<Message[]> {
    const limit = Math.min(100, options?.limit ?? 50);
    const params = new URLSearchParams({
      conversationId: channelId,
      limit: String(limit),
    });
    if (options?.beforeId != null) params.set("beforeId", String(options.beforeId));
    const res = await this.request<{
      messages: Array<{
        id: number;
        fromUser: string;
        toUser: string;
        body: string;
        createdAt: number;
      }>;
    }>("/messages?" + params.toString());
    if (!res.ok || !res.data?.messages) {
      throw new Error(res.error ?? "Failed to fetch messages");
    }
    return res.data.messages.map((m) => ({
      id: m.id,
      conversationId: channelId,
      fromUser: m.fromUser,
      toUser: m.toUser,
      body: m.body,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Send a message. Derives recipient from channelId (conversationId is userA__userB; "to" is the other user).
   */
  async sendMessage(channelId: string, content: string): Promise<Message> {
    const me = this.getCurrentUsername();
    if (!me) throw new Error("Not authenticated");
    const [a, b] = channelId.split("__").sort();
    if (!a || !b) throw new Error("Invalid channelId");
    const to = me === a ? b : a;
    const res = await this.request<{ id: number; body: string }>("/messages", {
      method: "POST",
      body: { conversationId: channelId, to, body: content },
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error ?? "Failed to send message");
    }
    return {
      id: res.data.id,
      conversationId: channelId,
      fromUser: me,
      toUser: to,
      body: res.data.body ?? content,
      createdAt: Math.floor(Date.now() / 1000),
    };
  }

  /** Mark messages as read up to lastReadMessageId. */
  async markRead(channelId: string, lastReadMessageId: number): Promise<void> {
    const res = await this.request("/read", {
      method: "POST",
      body: { conversationId: channelId, lastReadMessageId },
    });
    if (!res.ok) throw new Error(res.error ?? "Failed to mark read");
  }

  /** Leave channel: no API today; no-op. Document as future. */
  async leaveChannel(_channelId: string): Promise<void> {
    // API has no leave; no-op.
  }

  /** Subscribe to new messages. Today: no WebSocket; callback not called in real time. Use polling in hooks. */
  onMessage(callback: (message: Message) => void): UnsubscribeFn {
    return this.ws.on("message", callback as (payload: unknown) => void);
  }

  /** Subscribe to typing events. No API support today; no-op. */
  onTyping(callback: (typing: TypingEvent) => void): UnsubscribeFn {
    return this.ws.on("typing", callback as (payload: unknown) => void);
  }

  /** Subscribe to presence. Today: use GET /presence in hooks; this is for future WS. */
  onPresence(callback: (presence: PresenceEvent) => void): UnsubscribeFn {
    return this.ws.on("presence", callback as (payload: unknown) => void);
  }

  /** Fetch presence (online list, lastSeenAt). For use by hooks when no WebSocket. */
  async getPresence(): Promise<PresenceEvent> {
    const res = await this.request<{ online: string[]; lastSeenAt: Record<string, number> }>(
      "/presence"
    );
    if (!res.ok || !res.data) {
      return { online: [], lastSeenAt: {} };
    }
    return {
      online: res.data.online ?? [],
      lastSeenAt: res.data.lastSeenAt ?? {},
    };
  }
}
