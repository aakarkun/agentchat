import path from "path";
import fs from "fs";
import Fastify from "fastify";
import {
  ensureDb,
  register,
  login,
  signToken,
  verifyToken,
  listUsers,
  getOrCreateConversation,
  addMessage,
  getMessages,
  getInbox,
  setLastRead,
  getTotalUnreadCount,
} from "@agentchat/core";

// Run from repo root so data/agentchat.sqlite resolves correctly
const root = path.resolve(import.meta.dir, "..", "..");
if (process.cwd() !== root) process.chdir(root);

ensureDb();

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = parseInt(process.env.PORT ?? "8787", 10);

const fastify = Fastify({ logger: true });

// Web chat UI — register first so GET / is always available (path relative to this file)
const chatHtmlPath = path.join(import.meta.dir, "..", "public", "chat.html");
const chatHtml = fs.readFileSync(chatHtmlPath, "utf8");
fastify.get("/", async (_request, reply) => reply.type("text/html").send(chatHtml));
fastify.get("/chat", async (_request, reply) => reply.type("text/html").send(chatHtml));

declare module "fastify" {
  interface FastifyRequest {
    user?: { username: string };
  }
}

async function authMiddleware(
  request: { headers: { authorization?: string }; user?: { username: string } },
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
  request.user = { username: payload.username };
}

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
  const token = signToken(user.username);
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
  const token = signToken(user.username);
  return { token, username: user.username };
});

fastify.get("/users", { preHandler: authMiddleware }, async (request, reply) => {
  const users = listUsers().map((u) => u.username);
  return { users };
});

fastify.post<{
  Body: { to?: string };
}>("/dm", { preHandler: authMiddleware }, async (request, reply) => {
  const me = request.user!.username;
  const to = (request.body?.to ?? "").trim().toLowerCase();
  if (!to) return reply.code(400).send({ error: "to required" });
  if (to === me) return reply.code(400).send({ error: "Cannot DM yourself" });
  const convId = getOrCreateConversation(me, to);
  return { conversationId: convId, with: to };
});

fastify.get("/inbox", { preHandler: authMiddleware }, async (request, reply) => {
  const me = request.user!.username;
  const inbox = getInbox(me);
  return {
    inbox: inbox.map((e) => ({
      conversationId: e.conversation_id,
      otherUsername: e.other_username,
      lastMessageAt: e.last_message_at,
      lastMessagePreview: e.last_message_preview,
      unreadCount: e.unread_count,
    })),
  };
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
  const rows = getMessages(convId, beforeId, limit);
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
  const id = addMessage(cid, me, toUser, String(body));
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
  setLastRead(cid, me, lastReadMessageId);
  return { ok: true };
});

fastify.get("/unread", { preHandler: authMiddleware }, async (request, reply) => {
  const me = request.user!.username;
  const count = getTotalUnreadCount(me);
  return { count };
});

async function main() {
  try {
    await fastify.listen({ host: HOST, port: PORT });
    fastify.log.info(`Web chat: http://${HOST}:${PORT}/`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
