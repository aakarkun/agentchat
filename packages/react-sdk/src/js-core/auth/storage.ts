import { createLocalStorageAuth } from "../../core/utils/authStorage.js";
import type { TokenManager } from "./tokenManager.js";

export { createLocalStorageAuth };

/**
 * Create a TokenManager backed by localStorage. Safe to call in browsers; in
 * non-DOM environments the underlying helpers are no-ops.
 */
export function createLocalStorageTokenManager(
  key?: string
): TokenManager {
  const { getToken, setToken, clearToken } = createLocalStorageAuth(key);
  return {
    getToken,
    setToken,
    clearToken,
  };
}

