export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: number;
}

export interface Conversation {
  id: string;
  user_a: string;
  user_b: string;
  updated_at: number;
}

export interface Message {
  id: number;
  conversation_id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: number;
}

export interface Read {
  conversation_id: string;
  username: string;
  last_read_message_id: number;
}

export interface InboxEntry {
  conversation_id: string;
  other_username: string;
  last_message_at: number;
  last_message_preview: string | null;
  unread_count: number;
}

export interface TokenPayload {
  username: string;
  exp: number;
  iat: number;
}
