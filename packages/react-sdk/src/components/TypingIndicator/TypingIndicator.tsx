import React from "react";
import { useTypingIndicator } from "../../hooks/useTypingIndicator.js";

export interface TypingIndicatorProps {
  channelId: string;
  className?: string;
}

export function TypingIndicator({ channelId, className = "" }: TypingIndicatorProps) {
  const { typingUsers } = useTypingIndicator(channelId);
  if (typingUsers.size === 0) return null;
  return (
    <div className={`agentchat-typing-indicator ${className}`.trim()}>
      {Array.from(typingUsers).join(", ")} typing…
    </div>
  );
}
