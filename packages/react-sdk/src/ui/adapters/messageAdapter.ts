import type { Message } from "../../core/types.js";
import type { DisplayMessage, DisplayMessagePart } from "../types.js";

/**
 * Map a core Message to DisplayMessage for the unified UI.
 * Uses currentUsername to set role (user vs assistant).
 */
export function messageToDisplayMessage(
  message: Message,
  currentUsername: string | null
): DisplayMessage {
  const role = currentUsername && message.fromUser === currentUsername ? "user" : "assistant";
  const parts: DisplayMessagePart[] = [{ type: "text", text: message.body }];
  return {
    id: String(message.id),
    role,
    parts,
    metadata: {
      createdAt: message.createdAt,
      fromUser: message.fromUser,
    },
  };
}

/**
 * Map an array of core Messages to DisplayMessage[].
 */
export function messagesToDisplayMessages(
  messages: Message[],
  currentUsername: string | null
): DisplayMessage[] {
  return messages.map((m) => messageToDisplayMessage(m, currentUsername));
}
