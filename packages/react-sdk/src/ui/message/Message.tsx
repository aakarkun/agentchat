import React from "react";
import { formatMessageTime, toValidTimestamp } from "../../core/index.js";
import { Avatar } from "../primitives/Avatar.jsx";
import type { DisplayMessage } from "../types.js";

function defaultAvatarUrl(username: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
}

export interface MessageProps {
  message: DisplayMessage;
  /** Show avatar and sent time. Default true. */
  showAvatar?: boolean;
  showSentTime?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ChatMessage({
  message,
  showAvatar = true,
  showSentTime = true,
  className = "",
  children,
}: MessageProps) {
  const fromUser = message.metadata?.fromUser ?? (message.role === "user" ? "You" : "Assistant");
  const avatarUrl = message.metadata?.avatarUrl as string | undefined;
  const tsMs = toValidTimestamp(message.metadata?.createdAt);

  const layout =
    message.role === "user"
      ? "flex items-start gap-2 self-end flex-row-reverse py-1 max-w-[85%]"
      : "flex items-start gap-2 self-start flex-row py-1 max-w-[85%]";
  return (
    <div
      className={`${layout} ${className}`.trim()}
      data-message-id={message.id}
      data-role={message.role}
    >
      {children ?? (
        <>
          {showAvatar && (
            <Avatar
              src={avatarUrl ?? defaultAvatarUrl(fromUser)}
              alt={fromUser}
              size="sm"
              className="shrink-0"
            />
          )}
          <div
            className={
              message.role === "user"
                ? "flex min-w-0 flex-col items-end gap-1"
                : "flex min-w-0 flex-col items-start gap-1"
            }
          >
            <MessageContent message={message} />
            {showSentTime && tsMs != null && (
              <time
                className="text-[0.6875rem] text-muted-foreground px-1"
                dateTime={new Date(tsMs).toISOString()}
              >
                {formatMessageTime(tsMs)}
              </time>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export interface MessageContentProps {
  message: DisplayMessage;
  className?: string;
}

export function MessageContent({ message, className = "" }: MessageContentProps) {
  const isUser = message.role === "user";
  const bubble =
    isUser
      ? "rounded-[1rem_1rem_0.25rem_1rem] bg-primary text-primary-foreground px-4 py-2.5 text-[0.9375rem] leading-relaxed shadow-sm max-w-full"
      : "rounded-[1rem_1rem_1rem_0.25rem] border border-border bg-background text-foreground px-4 py-2.5 text-[0.9375rem] leading-relaxed shadow-sm max-w-full";
  return (
    <div className={`${bubble} ${className}`.trim()}>
      {message.parts.map((part, i) =>
        part.type === "text" ? (
          <MessageResponse key={`${message.id}-${i}`} text={part.text} />
        ) : null
      )}
    </div>
  );
}

export interface MessageResponseProps {
  text: string;
  className?: string;
}

export function MessageResponse({ text, className = "" }: MessageResponseProps) {
  return (
    <div className={`whitespace-pre-wrap break-words [&_a]:underline [&_a]:text-inherit ${className}`.trim()}>
      {text}
    </div>
  );
}
