export interface TokenManager {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
}

/**
 * Create an in-memory token manager. Useful for Node scripts and tests where
 * you don't want to touch localStorage.
 */
export function createMemoryTokenManager(
  initialToken: string | null = null
): TokenManager {
  let token = initialToken;
  return {
    getToken: () => token,
    setToken: (next: string) => {
      token = next;
    },
    clearToken: () => {
      token = null;
    },
  };
}

/**
 * Wrap existing getToken/setToken/clearToken callbacks into a TokenManager.
 */
export function createTokenManagerFromCallbacks(
  getToken: () => string | null,
  setToken: (token: string) => void,
  clearToken: () => void
): TokenManager {
  return {
    getToken,
    setToken,
    clearToken,
  };
}

