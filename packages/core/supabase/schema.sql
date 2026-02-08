-- Run once in Supabase SQL Editor (Project → SQL Editor).
-- Same logical schema as SQLite; messages.body stores plaintext today.
-- Future E2EE: body can store ciphertext; clients encrypt/decrypt; server stays agnostic.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  token_valid_after BIGINT
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS reads (
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  username TEXT NOT NULL,
  last_read_message_id BIGINT NOT NULL,
  PRIMARY KEY (conversation_id, username)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, id);
CREATE INDEX IF NOT EXISTS idx_reads_username ON reads(username);
