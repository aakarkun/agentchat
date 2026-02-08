import path from "path";
import fs from "fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  ensureDb,
  register,
  login,
  signToken,
  verifyToken,
  getTokenValidAfter,
  setTokenValidAfter,
  listUsers,
  userExists,
  getOrCreateConversation,
  addMessage,
  getMessages,
  getInbox,
  setLastRead,
  getTotalUnreadCount,
  addWaitlistEmail,
  addSubscribeEmail,
} from "@agentchat/core";

// Run from repo root so static files and paths resolve correctly
const root = path.resolve(import.meta.dir, "..", "..");
if (process.cwd() !== root) process.chdir(root);

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = parseInt(process.env.PORT ?? "8787", 10);

const fastify = Fastify({ logger: true });

// Lightweight presence: in-memory last-seen per user (updated on every auth request). No DB.
const ONLINE_MS = 2 * 60 * 1000; // 2 minutes
const lastSeen = new Map<string, number>();

function isOnline(username: string): boolean {
  const t = lastSeen.get(username);
  return t != null && Date.now() - t < ONLINE_MS;
}

// Static HTML pages (path relative to this file)
const publicDir = path.join(import.meta.dir, "..", "public");
const isDev = process.env.NODE_ENV !== "production";
function readPublic(name: string): string {
  return fs.readFileSync(path.join(publicDir, name), "utf8");
}
const chatHtmlCached = readPublic("chat.html");
const privacyHtmlCached = readPublic("privacy.html");
const termsHtmlCached = readPublic("terms.html");
function getChatHtml(): string {
  return isDev ? readPublic("chat.html") : chatHtmlCached;
}
fastify.get("/", async (_request, reply) => reply.type("text/html").send(getChatHtml()));
fastify.get("/chat", async (_request, reply) => reply.type("text/html").send(getChatHtml()));
fastify.get("/privacy", async (_request, reply) =>
  reply.type("text/html").send(isDev ? readPublic("privacy.html") : privacyHtmlCached)
);
fastify.get("/terms", async (_request, reply) =>
  reply.type("text/html").send(isDev ? readPublic("terms.html") : termsHtmlCached)
);

// Whitepaper leads: store in Supabase (waitlist = developer access queue, subscribe = update emails)
function isValidEmail(s: string): boolean {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()) && s.length <= 320;
}
fastify.post<{ Body: { email?: string } }>("/waitlist", async (request, reply) => {
  const email = request.body?.email;
  if (!email || !isValidEmail(email)) {
    return reply.code(400).send({ error: "Valid email required" });
  }
  try {
    const isNew = await addWaitlistEmail(email);
    if (isNew) return reply.code(201).send({ ok: true });
    return reply.code(200).send({ ok: true, already: true });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: "Failed to join waitlist" });
  }
});
fastify.post<{ Body: { email?: string } }>("/subscribe", async (request, reply) => {
  const email = request.body?.email;
  if (!email || !isValidEmail(email)) {
    return reply.code(400).send({ error: "Valid email required" });
  }
  try {
    const isNew = await addSubscribeEmail(email);
    if (isNew) return reply.code(201).send({ ok: true });
    return reply.code(200).send({ ok: true, already: true });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: "Failed to subscribe" });
  }
});

declare module "fastify" {
  interface FastifyRequest {
    user?: { username: string };
  }
}

async function authMiddleware(
  request: {
    headers: { authorization?: string };
    user?: { username: string };
    url?: string;
    routeOptions?: { url?: string };
  },
  reply: { code: (n: number) => { send: (x: object) => void } }
) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Missing or invalid Authorization" });
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return reply.code(401).send({ error: "Invalid or expired token" });
  }
  const validAfter = await getTokenValidAfter(payload.username);
  if (validAfter != null && payload.iat < validAfter) {
    return reply.code(401).send({ error: "Logged out from all sessions" });
  }
  request.user = { username: payload.username };
  const path = (request.routeOptions?.url ?? request.url ?? "").split("?")[0].replace(/\/$/, "") || "";
  if (path !== "/logout") lastSeen.set(payload.username, Date.now());
}

fastify.post("/logout", { preHandler: authMiddleware }, async (request, reply) => {
  const username = request.user!.username;
  await setTokenValidAfter(username, Math.floor(Date.now() / 1000));
  lastSeen.delete(username);
  return reply.send({ ok: true });
});

fastify.post<{
  Body: { username?: string; password?: string };
}>("/auth/register", async (request, reply) => {
  const { username, password } = request.body ?? {};
  if (!username || !password) {
    return reply.code(400).send({ error: "username and password required" });
  }
  const user = await register(username, password);
  if (!user) {
    return reply.code(409).send({ error: "Username already taken" });
  }
  const iat = Math.floor(Date.now() / 1000);
  await setTokenValidAfter(user.username, iat);
  const token = signToken(user.username, iat);
  return { token, username: user.username };
});

fastify.post<{
  Body: { username?: string; password?: string };
}>("/auth/login", async (request, reply) => {
  const { username, password } = request.body ?? {};
  if (!username || !password) {
    return reply.code(400).send({ error: "username and password required" });
  }
  const user = await login(username, password);
  if (!user) {
    return reply.code(401).send({ error: "Invalid credentials" });
  }
  const iat = Math.floor(Date.now() / 1000);
  await setTokenValidAfter(user.username, iat);
  const token = signToken(user.username, iat);
  return { token, username: user.username };
});

fastify.get("/users", { preHandler: authMiddleware }, async (request, reply) => {
  const list = await listUsers();
  const users = list.map((u) => u.username);
  const online = users.filter((u) => isOnline(u));
  return { users, online };
});

fastify.post<{
  Body: { to?: string };
}>("/dm", { preHandler: authMiddleware }, async (request, reply) => {
  const me = request.user!.username;
  const to = (request.body?.to ?? "").trim().toLowerCase();
  if (!to) return reply.code(400).send({ error: "to required" });
  if (to === me) return reply.code(400).send({ error: "Cannot DM yourself" });
  if (!(await userExists(to))) {
    return reply.code(404).send({ error: "User not found" });
  }
  const convId = await getOrCreateConversation(me, to);
  return { conversationId: convId, with: to };
});

fastify.get("/inbox", { preHandler: authMiddleware }, async (request, reply) => {
  reply.header("Cache-Control", "no-store");
  const me = request.user!.username;
  const inbox = await getInbox(me);
  const inboxWithMeta = await Promise.all(
    inbox.map(async (e) => ({
      conversationId: e.conversation_id,
      otherUsername: e.other_username,
      lastMessageAt: e.last_message_at,
      lastMessagePreview: e.last_message_preview,
      unreadCount: e.unread_count,
      online: isOnline(e.other_username),
      lastSeenAt: lastSeen.get(e.other_username) ?? null,
      otherUserRegistered: await userExists(e.other_username),
    }))
  );
  return { inbox: inboxWithMeta };
});

fastify.get<{
  Querystring: { conversationId?: string; beforeId?: string; limit?: string };
}>("/messages", { preHandler: authMiddleware }, async (request, reply) => {
  const me = request.user!.username;
  const convId = request.query.conversationId?.trim();
  if (!convId) return reply.code(400).send({ error: "conversationId required" });
  const [userA, userB] = convId.split("__").sort();
  if (!userA || !userB || (userA !== me && userB !== me)) {
    return reply.code(403).send({ error: "Not part of this conversation" });
  }
  const beforeId = request.query.beforeId
    ? parseInt(request.query.beforeId, 10)
    : null;
  const limit = Math.min(
    100,
    parseInt(request.query.limit ?? "50", 10) || 50
  );
  const rows = await getMessages(convId, beforeId, limit);
  return {
    messages: rows.map((r) => ({
      id: r.id,
      fromUser: r.from_user,
      toUser: r.to_user,
      body: r.body,
      createdAt: r.created_at,
    })),
  };
});

fastify.post<{
  Body: { conversationId?: string; to?: string; body?: string };
}>("/messages", { preHandler: authMiddleware }, async (request, reply) => {
  const me = request.user!.username;
  const { conversationId: convId, to, body } = request.body ?? {};
  if (!convId?.trim() || !to?.trim() || body === undefined) {
    return reply.code(400).send({ error: "conversationId, to, and body required" });
  }
  const cid = convId.trim();
  const [userA, userB] = cid.split("__").sort();
  if (!userA || !userB || (userA !== me && userB !== me)) {
    return reply.code(403).send({ error: "Not part of this conversation" });
  }
  const toUser = to.trim().toLowerCase();
  if (toUser !== userA && toUser !== userB) {
    return reply.code(400).send({ error: "Invalid recipient for this conversation" });
  }
  if (!(await userExists(toUser))) {
    return reply.code(404).send({ error: "Recipient is not a registered user" });
  }
  const id = await addMessage(cid, me, toUser, String(body));
  return { id, conversationId: cid, to: toUser, body: String(body) };
});

fastify.post<{
  Body: { conversationId?: string; lastReadMessageId?: number };
}>("/read", { preHandler: authMiddleware }, async (request, reply) => {
  const me = request.user!.username;
  const { conversationId: convId, lastReadMessageId } = request.body ?? {};
  if (!convId?.trim() || typeof lastReadMessageId !== "number") {
    return reply.code(400).send({ error: "conversationId and lastReadMessageId required" });
  }
  const cid = convId.trim();
  const [userA, userB] = cid.split("__").sort();
  if (!userA || !userB || (userA !== me && userB !== me)) {
    return reply.code(403).send({ error: "Not part of this conversation" });
  }
  await setLastRead(cid, me, lastReadMessageId);
  return { ok: true };
});

fastify.get("/unread", { preHandler: authMiddleware }, async (request, reply) => {
  const me = request.user!.username;
  const count = await getTotalUnreadCount(me);
  return { count };
});

fastify.get("/presence", { preHandler: authMiddleware }, async (_request, reply) => {
  reply.header("Cache-Control", "no-store");
  const online = Array.from(lastSeen.entries())
    .filter(([, t]) => Date.now() - t < ONLINE_MS)
    .map(([u]) => u);
  const lastSeenAt: Record<string, number> = {};
  lastSeen.forEach((t, u) => {
    lastSeenAt[u] = t;
  });
  return { online, lastSeenAt };
});

async function main() {
  try {
    await fastify.register(cors, { origin: true }); // allow whitepaper (different origin) to POST waitlist/subscribe
    await ensureDb();
    await fastify.listen({ host: HOST, port: PORT });
    fastify.log.info(`Web chat: http://${HOST}:${PORT}/`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
