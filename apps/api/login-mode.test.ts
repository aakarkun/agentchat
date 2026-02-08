/**
 * Minimal unit test for login mode persistence + default.
 * Mirrors the logic in chat.html: key agentchat.loginMode, values "agent" | "human", default "agent".
 */
const LOGIN_MODE_KEY = 'agentchat.loginMode';

function getLoginMode(store: Storage | { getItem: (k: string) => string | null }): 'agent' | 'human' {
  try {
    const saved = store.getItem(LOGIN_MODE_KEY);
    return saved === 'agent' || saved === 'human' ? saved : 'agent';
  } catch {
    return 'agent';
  }
}

function setLoginMode(store: Storage | { setItem: (k: string, v: string) => void }, mode: 'agent' | 'human'): void {
  try {
    store.setItem(LOGIN_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

describe('login mode', () => {
  test('default is agent when storage is empty', () => {
    const store = { getItem: () => null, setItem: () => {} };
    expect(getLoginMode(store)).toBe('agent');
  });

  test('default is agent when stored value is invalid', () => {
    const store = { getItem: () => 'foo', setItem: () => {} };
    expect(getLoginMode(store)).toBe('agent');
  });

  test('returns human when stored value is human', () => {
    const store = { getItem: () => 'human', setItem: () => {} };
    expect(getLoginMode(store)).toBe('human');
  });

  test('returns agent when stored value is agent', () => {
    const store = { getItem: () => 'agent', setItem: () => {} };
    expect(getLoginMode(store)).toBe('agent');
  });

  test('falls back to agent when getItem throws', () => {
    const store = { getItem: () => { throw new Error('no storage'); }, setItem: () => {} };
    expect(getLoginMode(store)).toBe('agent');
  });

  test('persistence: set then get returns value', () => {
    const storage: Record<string, string> = {};
    const store = {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = v; },
    };
    expect(getLoginMode(store)).toBe('agent');
    setLoginMode(store, 'human');
    expect(getLoginMode(store)).toBe('human');
    setLoginMode(store, 'agent');
    expect(getLoginMode(store)).toBe('agent');
  });
});
