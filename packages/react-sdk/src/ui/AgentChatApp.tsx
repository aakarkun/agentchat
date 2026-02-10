import React from "react";
import { useAgentChat } from "../core/index.js";
import { LoginScreen } from "./LoginScreen.jsx";
import { DefaultChatLayout } from "./DefaultChatLayout.jsx";
import type { DefaultChatLayoutProps } from "./DefaultChatLayout.jsx";
import type { LoginScreenProps } from "./LoginScreen.jsx";

export interface AgentChatAppProps extends DefaultChatLayoutProps {
  /** Props for the login screen when not connected. */
  loginScreenProps?: Partial<LoginScreenProps>;
}

/**
 * Plug-and-play app: shows LoginScreen when not connected, DefaultChatLayout when connected.
 * No custom UI code needed in the consuming app.
 */
export function AgentChatApp({
  loginScreenProps,
  ...layoutProps
}: AgentChatAppProps) {
  const { isConnected } = useAgentChat();

  if (!isConnected) {
    return <LoginScreen {...loginScreenProps} />;
  }

  return <DefaultChatLayout {...layoutProps} />;
}
