import * as argon2 from "argon2";
import { createUser, getUserByUsername, initDb } from "./db.js";
import type { User } from "./types.js";

export async function register(username: string, password: string): Promise<User | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) return null;
  const existing = await getUserByUsername(normalized);
  if (existing) return null;
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const now = Date.now();
  const row = await createUser(normalized, hash, now);
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    password_hash: row.password_hash,
    created_at: row.created_at,
  };
}

export async function login(username: string, password: string): Promise<User | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized || !password) return null;
  const row = await getUserByUsername(normalized);
  if (!row) return null;
  const ok = await argon2.verify(row.password_hash, password);
  return ok ? row : null;
}

export async function ensureDb(): Promise<void> {
  await initDb();
}
