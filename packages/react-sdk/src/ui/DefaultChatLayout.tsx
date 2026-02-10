import React, { useState } from "react";
import { useAgentChat, useChannels } from "../core/index.js";
import { Avatar } from "./primitives/Avatar.jsx";
import { ChatWindow } from "./ChatWindow.jsx";
import { ChatSidebar } from "./ChatSidebar.jsx";
import { AgentChatUI } from "./AgentChatUI.jsx";
import { HeaderMenu } from "./HeaderMenu.jsx";
import type { HeaderMenuItem } from "./HeaderMenu.jsx";

function defaultAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
}

export interface DefaultChatLayoutProps {
  /** Optional menu items for the header (e.g. Settings, Profile). */
  headerMenuItems?: HeaderMenuItem[];
  /**
   * Optional custom header menu renderer. Use this to render with shadcn DropdownMenu or your own component.
   * SDK feeds items; you supply the UI. When provided, headerMenuItems are passed and default HeaderMenu is not used.
   */
  renderHeaderMenu?: (items: HeaderMenuItem[]) => React.ReactNode;
  /** Empty state when no conversation is selected. */
  emptyStateMessage?: string;
  /** AgentChatUI empty title. */
  emptyTitle?: string;
  /** AgentChatUI empty description. */
  emptyDescription?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Plug-and-play chat layout: sidebar + header (avatar + name + optional menu) + AgentChatUI.
 * Uses SDK components only.
 */
export function DefaultChatLayout({
  headerMenuItems = [],
  renderHeaderMenu,
  emptyStateMessage = "Select a conversation or start a new chat.",
  emptyTitle = "Start a conversation",
  emptyDescription = "Type a message below to begin.",
  className = "",
  style,
}: DefaultChatLayoutProps) {
  const { channels } = useChannels();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const selectedChannel = selectedChannelId
    ? channels.find((c) => c.conversationId === selectedChannelId)
    : null;
  const headerName = selectedChannel?.otherUsername ?? selectedChannelId ?? null;
  const headerAvatarUrl =
    headerName != null ? defaultAvatarUrl(headerName) : undefined;

  const headerActionsNode =
    headerName && headerMenuItems.length > 0
      ? renderHeaderMenu
        ? renderHeaderMenu(headerMenuItems)
        : <HeaderMenu items={headerMenuItems} />
      : undefined;

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${className}`.trim()}
      style={style}
    >
      <ChatWindow
        sidebar={
          <ChatSidebar
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
          />
        }
        header={
          headerName ? (
            <div className="flex items-center gap-3">
              <Avatar src={headerAvatarUrl} alt={headerName} size="sm" />
              <span className="min-w-0 truncate font-semibold">{headerName}</span>
            </div>
          ) : undefined
        }
        headerActions={headerActionsNode}
      >
        {selectedChannelId ? (
          <AgentChatUI
            channelId={selectedChannelId}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
            {emptyStateMessage}
          </div>
        )}
      </ChatWindow>
    </div>
  );
}
