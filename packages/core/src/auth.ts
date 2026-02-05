import * as argon2 from "argon2";
import { getDb, initDb } from "./db.js";
import type { User } from "./types.js";

export async function register(username: string, password: string): Promise<User | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) return null;
  const d = getDb();
  const existing = d.prepare("SELECT id FROM users WHERE username = ?").get(normalized);
  if (existing) return null;
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const now = Date.now();
  const result = d
    .prepare(
      "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)"
    )
    .run(normalized, hash, now);
  return {
    id: result.lastInsertRowid as number,
    username: normalized,
    password_hash: hash,
    created_at: now,
  };
}

export async function login(username: string, password: string): Promise<User | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) return null;
  const d = getDb();
  const row = d
    .prepare(
      "SELECT id, username, password_hash, created_at FROM users WHERE username = ?"
    )
    .get(normalized) as User | undefined;
  if (!row) return null;
  const ok = await argon2.verify(row.password_hash, password);
  return ok ? row : null;
}

export function ensureDb(dbPath?: string): void {
  initDb(dbPath);
}
