import React, { createContext, useCallback, useEffect, useState } from "react";
import { AgentChatClient } from "../services/AgentChatClient.js";
import type { AgentChatConfig } from "../services/AgentChatClient.js";
import type { AuthToken, Participant } from "../services/types.js";

export interface AgentChatContextValue {
  client: AgentChatClient;
  isConnected: boolean;
  currentUser: Participant | null;
  loginAsHuman: (username: string, password: string) => Promise<AuthToken>;
  loginAsAgent: (username: string, password: string) => Promise<AuthToken>;
  logout: () => Promise<void>;
}

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

export interface AgentChatProviderProps {
  config: AgentChatConfig;
  children: React.ReactNode;
}

export function AgentChatProvider({ config, children }: AgentChatProviderProps) {
  const [client] = useState(() => new AgentChatClient(config));
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);

  const loginAsHuman = useCallback(
    async (username: string, password: string) => {
      const auth = await client.loginAsHuman(username, password);
      setCurrentUser({
        id: auth.username,
        username: auth.username,
        type: "human",
      });
      setIsConnected(true);
      return auth;
    },
    [client]
  );

  const loginAsAgent = useCallback(
    async (username: string, password: string) => {
      const auth = await client.loginAsAgent(username, password);
      setCurrentUser({
        id: auth.username,
        username: auth.username,
        type: "agent",
      });
      setIsConnected(true);
      return auth;
    },
    [client]
  );

  const logout = useCallback(async () => {
    await client.logout();
    setCurrentUser(null);
    setIsConnected(false);
  }, [client]);

  useEffect(() => {
    const me = client.getCurrentUsername();
    if (me) {
      setCurrentUser({ id: me, username: me, type: "human" });
      setIsConnected(true);
    }
  }, [client]);

  const value: AgentChatContextValue = {
    client,
    isConnected,
    currentUser,
    loginAsHuman,
    loginAsAgent,
    logout,
  };

  return (
    <AgentChatContext.Provider value={value}>
      {children}
    </AgentChatContext.Provider>
  );
}

export { AgentChatContext };
