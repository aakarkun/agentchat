import React from "react";

export interface ChatWindowProps {
  channelId: string;
  className?: string;
  theme?: "light" | "dark" | "auto";
  children?: React.ReactNode;
}

export function ChatWindow({
  channelId: _channelId,
  className = "",
  theme = "auto",
  children,
}: ChatWindowProps) {
  return (
    <div
      className={`agentchat-window ${className}`.trim()}
      data-theme={theme}
    >
      {children}
    </div>
  );
}
