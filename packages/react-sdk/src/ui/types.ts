/**
 * Unified chat contract for UI. Same shape for AgentChat (REST) and LLM (streaming) sources.
 */

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

export interface DisplayMessagePart {
  type: "text";
  text: string;
}

export interface DisplayMessageMetadata {
  createdAt?: number;
  fromUser?: string;
  [key: string]: unknown;
}

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  parts: DisplayMessagePart[];
  metadata?: DisplayMessageMetadata;
}

export interface ChatSource {
  messages: DisplayMessage[];
  sendMessage: (text: string) => Promise<void>;
  status: ChatStatus;
  error?: Error | null;
  stop?: () => void;
  regenerate?: () => void;
}
