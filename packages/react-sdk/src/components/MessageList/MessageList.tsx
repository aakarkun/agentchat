import React from "react";
import { useMessages } from "../../core/index.js";
import type { Message } from "../../core/index.js";

export interface MessageListProps {
  channelId: string;
  className?: string;
  renderMessage?: (message: Message) => React.ReactNode;
  groupByDate?: boolean;
  showAvatar?: boolean;
}

function DefaultMessageItem({ message }: { message: Message }) {
  return (
    <div className="agentchat-message" data-message-id={message.id}>
      <span className="agentchat-message-sender">{message.fromUser}</span>
      <span className="agentchat-message-body">{message.body}</span>
      <span className="agentchat-message-meta">
        {new Date(message.createdAt * 1000).toISOString()}
      </span>
    </div>
  );
}

export function MessageList({
  channelId,
  className = "",
  renderMessage,
  groupByDate = false,
  showAvatar = true,
}: MessageListProps) {
  const { messages, loading, error } = useMessages(channelId);

  if (loading) {
    return (
      <div className={`agentchat-message-list agentchat-message-list--loading ${className}`.trim()}>
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className={`agentchat-message-list agentchat-message-list--error ${className}`.trim()}>
        {error.message}
      </div>
    );
  }

  return (
    <div
      className={`agentchat-message-list ${className}`.trim()}
      data-group-by-date={groupByDate}
      data-show-avatar={showAvatar}
    >
      {messages.map((msg) =>
        renderMessage ? (
          <React.Fragment key={msg.id}>{renderMessage(msg)}</React.Fragment>
        ) : (
          <DefaultMessageItem key={msg.id} message={msg} />
        )
      )}
    </div>
  );
}
