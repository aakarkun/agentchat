import { useContext } from "react";
import { AgentChatContext } from "../provider.jsx";
import type { AgentChatContextValue } from "../provider.jsx";

export function useAgentChat(): AgentChatContextValue {
  const context = useContext(AgentChatContext);
  if (!context) {
    throw new Error("useAgentChat must be used within AgentChatProvider");
  }
  return context;
}
