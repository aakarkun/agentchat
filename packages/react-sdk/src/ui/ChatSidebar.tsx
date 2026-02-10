import React, { useCallback, useState } from "react";
import { useAgentChat, useChannels } from "../core/index.js";
import { Avatar } from "./primitives/Avatar.jsx";
import { Button } from "./primitives/Button.jsx";
import { Input } from "./primitives/Input.jsx";
import { ScrollArea } from "./primitives/ScrollArea.jsx";

export interface ChatSidebarProps {
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  className?: string;
  /** Label for the conversations list. */
  conversationsLabel?: string;
  /** Placeholder for the new-chat username input. */
  newChatPlaceholder?: string;
  /** Label for the new-chat submit button. */
  newChatButtonLabel?: string;
  /** Label for the logout button. */
  logoutLabel?: string;
}

/**
 * Side menu for chat: current user, logout, conversation list, and new-chat form.
 * Uses core useAgentChat + useChannels. Pass selectedChannelId and onSelectChannel from parent.
 * Style matches Shadcn new-york sidebar patterns; uses SDK tokens.
 */
export function ChatSidebar({
  selectedChannelId,
  onSelectChannel,
  className = "",
  conversationsLabel = "Conversations",
  newChatPlaceholder = "Username to message",
  newChatButtonLabel = "New chat",
  logoutLabel = "Log out",
}: ChatSidebarProps) {
  const { currentUser, logout } = useAgentChat();
  const { channels, loading: channelsLoading, createChannel, refetch } = useChannels();
  const [newChatUsername, setNewChatUsername] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleNewChat = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const to = newChatUsername.trim().toLowerCase();
      if (!to) return;
      setError("");
      setCreating(true);
      try {
        const ch = await createChannel(to);
        onSelectChannel(ch.conversationId);
        setNewChatUsername("");
        refetch();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start chat");
      } finally {
        setCreating(false);
      }
    },
    [newChatUsername, createChannel, onSelectChannel, refetch]
  );

  const username = currentUser?.username ?? "—";
  const profileAvatarUrl =
    username !== "—"
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
      : undefined;

  return (
    <aside
      className={`flex h-full w-64 min-w-64 flex-col border-r border-border bg-background ${className}`.trim()}
      data-slot="chat-sidebar"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Avatar src={profileAvatarUrl} alt={username} size="md" />
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">{username}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">
        <h3 className="mb-1 px-3 pt-2 text-xs font-medium text-muted-foreground">
          {conversationsLabel}
        </h3>
        {channelsLoading ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ScrollArea className="mb-2 min-h-0 flex-1">
            <ul className="list-none py-1 pr-2" role="list">
              {channels.map((ch) => (
                <li key={ch.conversationId}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-2 rounded-md border-none bg-transparent px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${
                      selectedChannelId === ch.conversationId ? "bg-accent text-accent-foreground" : ""
                    }`.trim()}
                    onClick={() => onSelectChannel(ch.conversationId)}
                  >
                    <span className="min-w-0 flex-1 truncate">{ch.otherUsername}</span>
                    {ch.unreadCount > 0 && (
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {ch.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
        <form className="flex shrink-0 flex-col gap-2 border-t border-border pt-2" onSubmit={handleNewChat}>
          <Input
            type="text"
            placeholder={newChatPlaceholder}
            value={newChatUsername}
            onChange={(e) => setNewChatUsername(e.target.value)}
            aria-label={newChatPlaceholder}
          />
          <Button
            type="submit"
            variant="default"
            disabled={creating || !newChatUsername.trim()}
            className="w-full"
          >
            {newChatButtonLabel}
          </Button>
          {error && (
            <p className="m-0 text-xs text-red-500" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
      <div className="shrink-0 border-t border-border p-2">
        <Button
          type="button"
          variant="default"
          className="h-8 w-full px-2 text-xs"
          onClick={() => logout()}
        >
          {logoutLabel}
        </Button>
      </div>
    </aside>
  );
}
