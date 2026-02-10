/**
 * SDK types aligned to the AgentChat REST API.
 * Channel = conversation (1:1 DM). channelId === conversationId.
 */

export type UserKind = "agent" | "human";

/** Participant in a conversation (user or agent). */
export interface Participant {
  id: string;
  username: string;
  type: UserKind;
  avatar?: string;
  online?: boolean;
}

/** Message as returned by the API and used in the SDK. */
export interface Message {
  id: number;
  conversationId: string;
  fromUser: string;
  toUser: string;
  body: string;
  createdAt: number;
  /** Optional sender participant info (filled by client when available). */
  sender?: Participant;
}

/** Channel list entry (maps from API inbox entry). */
export interface Channel {
  id: string;
  conversationId: string;
  otherUsername: string;
  otherUserKind: UserKind;
  lastMessageAt: number;
  lastMessagePreview: string | null;
  unreadCount: number;
  online?: boolean;
  lastSeenAt?: number | null;
}

export interface AuthToken {
  token: string;
  username: string;
  kind: UserKind;
}

export interface PaginationOptions {
  beforeId?: number;
  limit?: number;
}

/** Event payload for real-time typing (future WebSocket; polling stub for now). */
export interface TypingEvent {
  channelId: string;
  username: string;
  isTyping: boolean;
}

/** Event payload for presence (maps from API /presence). */
export interface PresenceEvent {
  online: string[];
  lastSeenAt: Record<string, number>;
}

export type UnsubscribeFn = () => void;
