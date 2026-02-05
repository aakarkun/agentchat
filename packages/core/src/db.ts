import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "fs";
import path from "path";
import type { InboxEntry } from "./types.js";

const DEFAULT_PATH =
  process.env.AGENTCHAT_DB_PATH ??
  path.join(process.cwd(), "data", "agentchat.sqlite");

let db: Database | null = null;

export function initDb(dbPath: string = DEFAULT_PATH): Database {
  if (db) return db;
  const dir = path.dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const database = new Database(dbPath);
  database.run("PRAGMA journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_a TEXT NOT NULL,
      user_b TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );
    CREATE TABLE IF NOT EXISTS reads (
      conversation_id TEXT NOT NULL,
      username TEXT NOT NULL,
      last_read_message_id INTEGER NOT NULL,
      PRIMARY KEY (conversation_id, username),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, id);
    CREATE INDEX IF NOT EXISTS idx_reads_username ON reads(username);
  `);
  // Migration: add token_valid_after for single-session / logout-everywhere
  const tableInfo = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!tableInfo.some((c) => c.name === "token_valid_after")) {
    database.run("ALTER TABLE users ADD COLUMN token_valid_after INTEGER");
  }
  db = database;
  return database;
}

/** Unix seconds. Tokens with iat < this are invalid (logged out everywhere or superseded by newer login). */
export function getTokenValidAfter(username: string): number | null {
  const d = getDb();
  const row = d
    .prepare("SELECT token_valid_after FROM users WHERE username = ?")
    .get(username) as { token_valid_after: number | null } | undefined;
  const v = row?.token_valid_after;
  return v != null ? v : null;
}

export function setTokenValidAfter(username: string, timestampSeconds: number): void {
  const d = getDb();
  d.prepare("UPDATE users SET token_valid_after = ? WHERE username = ?").run(timestampSeconds, username);
}

export function getDb(): Database {
  if (!db) return initDb();
  return db;
}

export function conversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join("__");
}

/** Returns true if the username is registered. */
export function userExists(username: string): boolean {
  const d = getDb();
  const row = d.prepare("SELECT 1 FROM users WHERE username = ?").get(username);
  return row != null;
}

export function listUsers(): { username: string }[] {
  const d = getDb();
  const rows = d.prepare("SELECT username FROM users ORDER BY username").all() as {
    username: string;
  }[];
  return rows;
}

export function getOrCreateConversation(userA: string, userB: string): string {
  const id = conversationId(userA, userB);
  const d = getDb();
  const existing = d.prepare("SELECT id FROM conversations WHERE id = ?").get(id);
  if (existing) return id;
  const now = Date.now();
  d.prepare(
    "INSERT INTO conversations (id, user_a, user_b, updated_at) VALUES (?, ?, ?, ?)"
  ).run(id, userA, userB, now);
  return id;
}

export function addMessage(
  conversationId: string,
  fromUser: string,
  toUser: string,
  body: string
): number {
  const d = getDb();
  const now = Date.now();
  const result = d
    .prepare(
      `INSERT INTO messages (conversation_id, from_user, to_user, body, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(conversationId, fromUser, toUser, body, now) as { lastInsertRowid: number };
  d.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(
    now,
    conversationId
  );
  return result.lastInsertRowid as number;
}

export function getMessages(
  convId: string,
  beforeId: number | null,
  limit: number
): { id: number; from_user: string; to_user: string; body: string; created_at: number }[] {
  const d = getDb();
  const stmt =
    beforeId == null
      ? d.prepare(
          `SELECT id, from_user, to_user, body, created_at FROM messages
           WHERE conversation_id = ? ORDER BY id DESC LIMIT ?`
        )
      : d.prepare(
          `SELECT id, from_user, to_user, body, created_at FROM messages
           WHERE conversation_id = ? AND id < ? ORDER BY id DESC LIMIT ?`
        );
  const rows = (beforeId == null
    ? stmt.all(convId, limit)
    : stmt.all(convId, beforeId, limit)) as {
    id: number;
    from_user: string;
    to_user: string;
    body: string;
    created_at: number;
  }[];
  return rows;
}

export function setLastRead(convId: string, username: string, lastReadMessageId: number): void {
  const d = getDb();
  d.prepare(
    `INSERT INTO reads (conversation_id, username, last_read_message_id)
     VALUES (?, ?, ?)
     ON CONFLICT(conversation_id, username) DO UPDATE SET last_read_message_id = ?`
  ).run(convId, username, lastReadMessageId, lastReadMessageId);
}

export function getLastReadMessageId(convId: string, username: string): number | null {
  const d = getDb();
  const row = d
    .prepare("SELECT last_read_message_id FROM reads WHERE conversation_id = ? AND username = ?")
    .get(convId, username) as { last_read_message_id: number } | undefined;
  return row ? row.last_read_message_id : null;
}

export function getInbox(username: string): InboxEntry[] {
  const d = getDb();
  const convs = d
    .prepare(
      `SELECT id, user_a, user_b, updated_at FROM conversations
       WHERE user_a = ? OR user_b = ?
       ORDER BY updated_at DESC`
    )
    .all(username, username) as { id: string; user_a: string; user_b: string; updated_at: number }[];

  const out: InboxEntry[] = [];
  for (const c of convs) {
    const other = c.user_a === username ? c.user_b : c.user_a;
    const lastMsg = d
      .prepare(
        `SELECT id, body, created_at FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1`
      )
      .get(c.id) as { id: number; body: string; created_at: number } | undefined;
    const lastReadId = getLastReadMessageId(c.id, username);
    const unreadCount =
      lastMsg && lastReadId != null
        ? (d.prepare(
            `SELECT COUNT(*) as n FROM messages WHERE conversation_id = ? AND id > ? AND to_user = ?`
          ).get(c.id, lastReadId, username) as { n: number }).n
        : lastMsg
          ? (d.prepare(
              `SELECT COUNT(*) as n FROM messages WHERE conversation_id = ? AND to_user = ?`
            ).get(c.id, username) as { n: number }).n
          : 0;
    out.push({
      conversation_id: c.id,
      other_username: other,
      last_message_at: lastMsg?.created_at ?? c.updated_at,
      last_message_preview: lastMsg?.body ?? null,
      unread_count: unreadCount,
    });
  }
  return out;
}

export function getTotalUnreadCount(username: string): number {
  const inbox = getInbox(username);
  return inbox.reduce((s, e) => s + e.unread_count, 0);
}
