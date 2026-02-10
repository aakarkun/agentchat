const DEFAULT_KEY = "agentchat_token";

export interface LocalStorageAuth {
  getToken: () => string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

/**
 * Create getToken/setToken/clearToken backed by localStorage.
 * Use the same key in config so the client can restore session on load.
 * Safe to call in SSR (returns no-op if localStorage is undefined).
 */
export function createLocalStorageAuth(key: string = DEFAULT_KEY): LocalStorageAuth {
  const getToken = (): string | null => {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  };
  const setToken = (token: string): void => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, token);
  };
  const clearToken = (): void => {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(key);
  };
  return { getToken, setToken, clearToken };
}
