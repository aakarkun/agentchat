import React, { useState } from "react";
import { useSendMessage, useTypingIndicator } from "../../core/index.js";

export interface MessageInputProps {
  channelId: string;
  placeholder?: string;
  onSend?: (content: string) => void;
  maxLength?: number;
  showTypingIndicator?: boolean;
  allowAttachments?: boolean;
}

export function MessageInput({
  channelId,
  placeholder = "Type a message…",
  onSend,
  maxLength,
  showTypingIndicator: _showTypingIndicator = true,
  allowAttachments: _allowAttachments = false,
}: MessageInputProps) {
  const { sendMessage } = useSendMessage(channelId);
  const { startTyping, stopTyping } = useTypingIndicator(channelId);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || sending) return;
    if (maxLength != null && text.length > maxLength) return;
    setSending(true);
    try {
      await sendMessage(text);
      setContent("");
      onSend?.(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="agentchat-message-input"
    >
      <input
        type="text"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          startTyping();
        }}
        onBlur={() => stopTyping()}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={sending}
        aria-label="Message input"
      />
      <button type="submit" disabled={sending || !content.trim()}>
        Send
      </button>
    </form>
  );
}
