import postgres from "postgres";
import type { InboxEntry } from "./types.js";

const DATABASE_URL = process.env.DATABASE_URL;

let sql: ReturnType<typeof postgres> | null = null;

function getSql(): ReturnType<typeof postgres> {
  if (!sql) {
    if (!DATABASE_URL?.trim()) {
      throw new Error(
        "DATABASE_URL is required. Set it to your Supabase (or Postgres) connection string."
      );
    }
    sql = postgres(DATABASE_URL, {
      max: 1,
      connect_timeout: 15,
    });
  }
  return sql;
}

/** Connect to Postgres and ensure schema exists. Run once at startup. Warms the connection so first login is not slow. */
export async function initDb(): Promise<ReturnType<typeof postgres>> {
  if (sql) return sql;
  getSql();
  await sql!`SELECT 1`;
  try {
    await sql!`SET statement_timeout = '10s'`;
  } catch {
    // Ignore if server doesn't support or rejects (e.g. restricted user)
  }
  // Schema is applied via packages/core/supabase/01_initial.sql and 02_add_user_kind_and_leads.sql in Supabase; no-op here or run migrations if needed
  return sql!;
}

/** Run a trivial query; returns true if DB is reachable. Use for /health. */
export async function ping(): Promise<boolean> {
  try {
    const s = getSql();
    await s`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** Run a trivial query against the users table; use to verify login path can reach DB. */
export async function pingUsersTable(): Promise<boolean> {
  try {
    const s = getSql();
    await s`SELECT 1 FROM users LIMIT 1`;
    return true;
  } catch {
    return false;
  }
}

/** Unix seconds. Tokens with iat < this are invalid (logged out everywhere or superseded by newer login). */
export async function getTokenValidAfter(username: string): Promise<number | null> {
  const s = getSql();
  const [row] = await s`
    SELECT token_valid_after FROM users WHERE username = ${username}
  ` as { token_valid_after: number | null }[];
  const v = row?.token_valid_after;
  return v != null ? v : null;
}

export async function setTokenValidAfter(username: string, timestampSeconds: number): Promise<void> {
  const s = getSql();
  await s`
    UPDATE users SET token_valid_after = ${timestampSeconds} WHERE username = ${username}
  `;
}

export function conversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join("__");
}

/** Returns true if the username is registered. */
export async function userExists(username: string): Promise<boolean> {
  const s = getSql();
  const [row] = await s`SELECT 1 FROM users WHERE username = ${username}` as { "?column?": number }[];
  return row != null;
}

export async function listUsers(): Promise<{ username: string; kind: 'agent' | 'human' }[]> {
  const s = getSql();
  const rows = await s`SELECT username, kind FROM users ORDER BY username` as { username: string; kind: 'agent' | 'human' }[];
  return rows;
}

/** Insert user; returns User or null if username already exists (unique violation). kind defaults to 'human'. */
export async function createUser(
  username: string,
  passwordHash: string,
  createdAt: number,
  kind: 'agent' | 'human' = 'human'
): Promise<{ id: number; username: string; password_hash: string; created_at: number; kind: 'agent' | 'human' } | null> {
  const s = getSql();
  try {
    const [row] = await s`
      INSERT INTO users (username, password_hash, created_at, kind)
      VALUES (${username}, ${passwordHash}, ${createdAt}, ${kind})
      RETURNING id, username, password_hash, created_at, kind
    ` as { id: number; username: string; password_hash: string; created_at: number; kind: 'agent' | 'human' }[];
    return row ?? null;
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    if (code === "23505") return null; // unique_violation
    throw err;
  }
}

/** Get user by username for login. */
export async function getUserByUsername(username: string): Promise<
  { id: number; username: string; password_hash: string; created_at: number; kind: 'agent' | 'human' } | null
> {
  const s = getSql();
  const [row] = await s`
    SELECT id, username, password_hash, created_at, kind FROM users WHERE username = ${username}
  ` as { id: number; username: string; password_hash: string; created_at: number; kind: 'agent' | 'human' }[];
  return row ?? null;
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<string> {
  const id = conversationId(userA, userB);
  const s = getSql();
  const [existing] = await s`SELECT id FROM conversations WHERE id = ${id}` as { id: string }[];
  if (existing) return id;
  const now = Date.now();
  await s`
    INSERT INTO conversations (id, user_a, user_b, updated_at)
    VALUES (${id}, ${userA}, ${userB}, ${now})
  `;
  return id;
}

export async function addMessage(
  conversationId: string,
  fromUser: string,
  toUser: string,
  body: string
): Promise<number> {
  const s = getSql();
  const now = Date.now();
  const [row] = await s`
    INSERT INTO messages (conversation_id, from_user, to_user, body, created_at)
    VALUES (${conversationId}, ${fromUser}, ${toUser}, ${body}, ${now})
    RETURNING id
  ` as { id: number }[];
  await s`
    UPDATE conversations SET updated_at = ${now} WHERE id = ${conversationId}
  `;
  return row!.id;
}

export async function getMessages(
  convId: string,
  beforeId: number | null,
  limit: number
): Promise<{ id: number; from_user: string; to_user: string; body: string; created_at: number }[]> {
  const s = getSql();
  const rows =
    beforeId == null
      ? await s`
          SELECT id, from_user, to_user, body, created_at FROM messages
          WHERE conversation_id = ${convId} ORDER BY id DESC LIMIT ${limit}
        `
      : await s`
          SELECT id, from_user, to_user, body, created_at FROM messages
          WHERE conversation_id = ${convId} AND id < ${beforeId} ORDER BY id DESC LIMIT ${limit}
        `;
  return rows as { id: number; from_user: string; to_user: string; body: string; created_at: number }[];
}

export async function setLastRead(
  convId: string,
  username: string,
  lastReadMessageId: number
): Promise<void> {
  const s = getSql();
  await s`
    INSERT INTO reads (conversation_id, username, last_read_message_id)
    VALUES (${convId}, ${username}, ${lastReadMessageId})
    ON CONFLICT (conversation_id, username) DO UPDATE SET last_read_message_id = EXCLUDED.last_read_message_id
  `;
}

async function getLastReadMessageId(convId: string, username: string): Promise<number | null> {
  const s = getSql();
  const [row] = await s`
    SELECT last_read_message_id FROM reads WHERE conversation_id = ${convId} AND username = ${username}
  ` as { last_read_message_id: number }[];
  return row ? row.last_read_message_id : null;
}

export async function getInbox(username: string): Promise<InboxEntry[]> {
  const s = getSql();
  const convs = await s`
    SELECT id, user_a, user_b, updated_at FROM conversations
    WHERE user_a = ${username} OR user_b = ${username}
    ORDER BY updated_at DESC
  ` as { id: string; user_a: string; user_b: string; updated_at: number }[];

  const out: InboxEntry[] = [];
  for (const c of convs) {
    const other = c.user_a === username ? c.user_b : c.user_a;
    const [lastMsg] = await s`
      SELECT id, body, created_at FROM messages WHERE conversation_id = ${c.id} ORDER BY id DESC LIMIT 1
    ` as { id: number; body: string; created_at: number }[];
    const lastReadId = await getLastReadMessageId(c.id, username);
    let unreadCount: number;
    if (lastMsg && lastReadId != null) {
      const [r] = await s`
        SELECT COUNT(*)::int as n FROM messages WHERE conversation_id = ${c.id} AND id > ${lastReadId} AND to_user = ${username}
      ` as { n: number }[];
      unreadCount = Number(r?.n ?? 0);
    } else if (lastMsg) {
      const [r] = await s`
        SELECT COUNT(*)::int as n FROM messages WHERE conversation_id = ${c.id} AND to_user = ${username}
      ` as { n: number }[];
      unreadCount = Number(r?.n ?? 0);
    } else {
      unreadCount = 0;
    }
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

export async function getTotalUnreadCount(username: string): Promise<number> {
  const inbox = await getInbox(username);
  return inbox.reduce((s, e) => s + e.unread_count, 0);
}

/** Whitepaper: add email to waitlist (developer access queue). Returns true if new, false if already on waitlist. */
export async function addWaitlistEmail(email: string): Promise<boolean> {
  const s = getSql();
  const normalized = email.trim().toLowerCase();
  const rows = await s`
    INSERT INTO waitlist (email) VALUES (${normalized})
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  ` as { id: number }[];
  return rows.length > 0;
}

/** Whitepaper: add email to subscribe (update emails). Returns true if new, false if already subscribed. */
export async function addSubscribeEmail(email: string): Promise<boolean> {
  const s = getSql();
  const normalized = email.trim().toLowerCase();
  const rows = await s`
    INSERT INTO subscribe (email) VALUES (${normalized})
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  ` as { id: number }[];
  return rows.length > 0;
}
