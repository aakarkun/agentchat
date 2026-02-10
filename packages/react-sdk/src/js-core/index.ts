// Framework-agnostic core surface for AgentChat.
// This file re-exports the non-React client, error model, types, and helpers.

export {
  AgentChatClient,
  type AgentChatConfig,
} from "../core/client.js";

export { AgentChatError } from "../core/errors.js";
export { WebSocketManager } from "../core/WebSocketManager.js";

// Core domain types
export type {
  UserKind,
  Participant,
  Message,
  Channel,
  AuthToken,
  PaginationOptions,
  TypingEvent,
  PresenceEvent,
  UnsubscribeFn,
} from "../core/types.js";

// Auth and storage helpers
export * from "./auth/tokenManager.js";
export * from "./auth/storage.js";

// Realtime abstraction
export * from "./realtime/connection.js";

