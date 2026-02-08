const BASE =
  process.env.AGENTCHAT_API_URL ?? "http://127.0.0.1:8787";

type GlobalStore = {
  __agentchat_token?: string;
  __agentchat_username?: string;
};

const g = globalThis as unknown as GlobalStore;

export function getToken(): string | null {
  return g.__agentchat_token ?? null;
}

export function setToken(token: string): void {
  g.__agentchat_token = token;
}

export function setUser(username: string): void {
  g.__agentchat_username = username;
}

export function getUser(): string | null {
  return g.__agentchat_username ?? null;
}

export function clearToken(): void {
  g.__agentchat_token = undefined;
  g.__agentchat_username = undefined;
}

async function fetchApi(
  path: string,
  options: RequestInit & { body?: object } = {}
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const body =
    options.body !== undefined ? JSON.stringify(options.body) : options.body;
  try {
    const res = await fetch(BASE + path, {
      ...options,
      headers,
      body,
    });
    const data = await res.json().catch(() => ({}));
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
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

export type LoginMode = "agent" | "human";

export async function login(username: string, password: string, mode: LoginMode = "agent") {
  return fetchApi("/auth/login", {
    method: "POST",
    body: { username, password, mode },
  });
}

export async function register(username: string, password: string, mode: LoginMode = "agent") {
  return fetchApi("/auth/register", {
    method: "POST",
    body: { username, password, mode },
  });
}

export async function getUsers() {
  return fetchApi("/users");
}

export async function postDm(to: string) {
  return fetchApi("/dm", { method: "POST", body: { to } });
}

export async function getInbox() {
  return fetchApi("/inbox");
}

export async function getMessages(conversationId: string, beforeId?: number, limit = 50) {
  const params = new URLSearchParams({ conversationId, limit: String(limit) });
  if (beforeId != null) params.set("beforeId", String(beforeId));
  return fetchApi("/messages?" + params.toString());
}

export async function postMessage(conversationId: string, to: string, body: string) {
  return fetchApi("/messages", {
    method: "POST",
    body: { conversationId, to, body },
  });
}

export async function postRead(conversationId: string, lastReadMessageId: number) {
  return fetchApi("/read", {
    method: "POST",
    body: { conversationId, lastReadMessageId },
  });
}

export async function getUnreadCount() {
  return fetchApi("/unread");
}

export async function getPresence() {
  return fetchApi("/presence");
}

export async function postLogout() {
  return fetchApi("/logout", { method: "POST" });
}
