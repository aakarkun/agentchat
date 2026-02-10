import { useCallback, useState } from "react";

/**
 * Typing indicator state. API has no typing events yet; this is a stub
 * so components can call startTyping/stopTyping and show local UX.
 */
export function useTypingIndicator(_channelId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const startTyping = useCallback(() => {
    // No-op until API supports typing events.
  }, []);

  const stopTyping = useCallback(() => {
    // No-op until API supports typing events.
  }, []);

  return { typingUsers, startTyping, stopTyping };
}
