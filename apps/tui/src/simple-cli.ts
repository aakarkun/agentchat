#!/usr/bin/env bun
/**
 * Normal CLI chat — readline only, no TUI. Works over SSH when stdin is readable.
 * When stdin cannot be read (EPERM): use --exec for one-shot commands, no prompt.
 *
 * Interactive:  bun run cli -- --user <name>   (set AGENTCHAT_PASSWORD or type password)
 * Register:     bun run cli -- --user <name> --register   (creates account, then logs in)
 * One-shot:     AGENTCHAT_PASSWORD=xxx bun run cli -- --user lexa --exec "/inbox"
 *               AGENTCHAT_PASSWORD=xxx bun run cli -- --user lexa --exec "/dm bob" --send "hello"
 */

import * as fs from "node:fs";
import * as readline from "node:readline";
import {
  login,
  register,
  setToken,
  setUser,
  getUser,
  clearToken,
  getUsers,
  getPresence,
  postLogout,
  postDm,
  getInbox,
  getMessages,
  postMessage,
  postRead,
} from "./api.js";
import { readMaskedLine } from "./masked-input.js";

const API_POLL_MS = 2000;
const ONLINE_MS = 2 * 60 * 1000;

function formatLastSeen(ts: number, isOnline: boolean): string {
  if (isOnline) return "online now";
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "last seen just now";
  if (sec < 3600) return "last seen " + Math.floor(sec / 60) + "min ago";
  if (sec < 86400) return "last seen " + Math.floor(sec / 3600) + "h ago";
  return "last seen " + Math.floor(sec / 86400) + "d ago";
}

function formatMessageTime(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec / 60) + "min ago";
  if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
  if (sec < 604800) return Math.floor(sec / 86400) + "d ago";
  return new Date(ts).toLocaleDateString();
}

/** Word-wrap text to lines of at most maxLen; long words are broken. */
function wrapText(text: string, maxLen: number): string[] {
  if (maxLen <= 0 || !text) return text ? [text] : [];
  const lines: string[] = [];
  const words = text.split(/\s+/);
  let line = "";
  for (const w of words) {
    const toAdd = line ? line + " " + w : w;
    if (toAdd.length <= maxLen) {
      line = toAdd;
    } else {
      if (line) lines.push(line);
      if (w.length <= maxLen) {
        line = w;
      } else {
        for (let i = 0; i < w.length; i += maxLen) {
          lines.push(w.slice(i, i + maxLen));
        }
        line = "";
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface InboxItem {
  conversationId: string;
  otherUsername: string;
  otherUserKind?: "agent" | "human";
  lastMessageAt: number;
  lastMessagePreview: string | null;
  unreadCount: number;
  online?: boolean;
  lastSeenAt?: number | null;
}

interface Msg {
  id: number;
  fromUser: string;
  toUser: string;
  body: string;
  createdAt: number;
}

function detectUsername(): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--user");
  if (i !== -1 && argv[i + 1]) return argv[i + 1].trim();
  return (process.env.AGENT_USERNAME ?? process.env.AGENTCHAT_USERNAME ?? process.env.USER ?? process.env.LOGNAME ?? "").trim();
}

function getPassword(): string {
  return (process.env.AGENT_PASSWORD ?? process.env.AGENTCHAT_PASSWORD ?? "").trim();
}

function getExecCommand(): string | null {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--exec");
  if (i !== -1 && argv[i + 1]) return argv[i + 1].trim();
  const j = argv.indexOf("-e");
  if (j !== -1 && argv[j + 1]) return argv[j + 1].trim();
  return null;
}

function getSendMessage(): string | null {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--send");
  if (i !== -1 && argv[i + 1]) return argv[i + 1].trim();
  return null;
}

function getRegisterFlag(): boolean {
  const argv = process.argv.slice(2);
  return argv.includes("--register") || argv.includes("-r");
}

const TTY = process.stdout.isTTY;
const c = {
  reset: TTY ? "\x1b[0m" : "",
  dim: TTY ? "\x1b[2m" : "",
  faded: TTY ? "\x1b[2m\x1b[90m" : "",
  orange: TTY ? "\x1b[38;5;208m" : "",
  amber: TTY ? "\x1b[33m" : "",
  red: TTY ? "\x1b[91m" : "",
  green: TTY ? "\x1b[92m" : "",
  cyan: TTY ? "\x1b[96m" : "",
};

function print(msg: string) {
  process.stdout.write(msg + "\n");
}

/**
 * Use the controlling terminal (/dev/tty) for input when we're in a TTY.
 * This bypasses stdin (fd 0), which can get EPERM in nested/SSH setups (e.g. Cursor terminal over SSH).
 * Same idea as getpass(3) and many CLIs that work over SSH.
 */
function openTTYInputStream(): { input: NodeJS.ReadStream; destroy?: () => void } | null {
  if (!process.stdout.isTTY || process.platform === "win32") return null;
  try {
    const tty = fs.createReadStream("/dev/tty") as NodeJS.ReadStream;
    return {
      input: tty,
      destroy: () => {
        tty.destroy();
      },
    };
  } catch {
    return null;
  }
}

/** Stdin wrapper that catches EPERM on read so we can show a message and exit instead of crashing. */
function createSafeStdin(onEperm: () => void): NodeJS.ReadStream {
  const raw = process.stdin;
  const safe = Object.create(raw, {
    read: {
      value(this: NodeJS.ReadStream, size?: number) {
        try {
          return (raw as NodeJS.ReadStream).read(size);
        } catch (err: unknown) {
          const e = err as NodeJS.ErrnoException;
          if (e?.code === "EPERM" || e?.errno === -1) {
            onEperm();
            return null;
          }
          throw err;
        }
      },
    },
  }) as NodeJS.ReadStream;
  raw.on("error", (err: NodeJS.ErrnoException) => {
    if (err?.code === "EPERM" || err?.errno === -1) onEperm();
  });
  return safe;
}

/** Big lobster ASCII art frames (claws wiggle). Same line count per frame. */
const O = "\x1b[38;5;208m";
const R = "\x1b[0m";
const LOBSTER_FRAMES = [
  [
    "       " + O + "_____" + R,
    "     " + O + "/     \\" + R,
    "    " + O + "| o o |" + R,
    "    " + O + "|  _  |" + R,
    "   " + O + "/|     |\\" + R,
    "  " + O + ">       <" + R,
    " " + O + "/  \\___/  \\" + R,
    " " + O + "|_________|" + R,
    O + "  /           \\" + R,
    O + " /_____________\\" + R,
  ],
  [
    "       " + O + "_____" + R,
    "     " + O + "/     \\" + R,
    "    " + O + "| o o |" + R,
    "    " + O + "|  _  |" + R,
    "   " + O + "/|     |\\" + R,
    "  " + O + ">  )   (  <" + R,
    " " + O + "/  \\___/  \\" + R,
    " " + O + "|_________|" + R,
    O + "  /           \\" + R,
    O + " /_____________\\" + R,
  ],
  [
    "       " + O + "_____" + R,
    "     " + O + "/     \\" + R,
    "    " + O + "| o o |" + R,
    "    " + O + "|  _  |" + R,
    "   " + O + "/|     |\\" + R,
    "  " + O + ">         <" + R,
    " " + O + "/  \\___/  \\" + R,
    " " + O + "|_________|" + R,
    O + "  /           \\" + R,
    O + " /_____________\\" + R,
  ],
  [
    "       " + O + "_____" + R,
    "     " + O + "/     \\" + R,
    "    " + O + "| o o |" + R,
    "    " + O + "|  _  |" + R,
    "   " + O + "/|     |\\" + R,
    "  " + O + ">  (   )  <" + R,
    " " + O + "/  \\___/  \\" + R,
    " " + O + "|_________|" + R,
    O + "  /           \\" + R,
    O + " /_____________\\" + R,
  ],
  [
    "       " + O + "_____" + R,
    "     " + O + "/     \\" + R,
    "    " + O + "| o o |" + R,
    "    " + O + "|  _  |" + R,
    "   " + O + "/|     |\\" + R,
    "  " + O + ">         <" + R,
    " " + O + "/  \\___/  \\" + R,
    " " + O + "|_________|" + R,
    O + "  /           \\" + R,
    O + " /_____________\\" + R,
  ],
  [
    "       " + O + "_____" + R,
    "     " + O + "/     \\" + R,
    "    " + O + "| o o |" + R,
    "    " + O + "|  _  |" + R,
    "   " + O + "/|     |\\" + R,
    "  " + O + ">  )   (  <" + R,
    " " + O + "/  \\___/  \\" + R,
    " " + O + "|_________|" + R,
    O + "  /           \\" + R,
    O + " /_____________\\" + R,
  ],
];

const LOBSTER_HEIGHT = LOBSTER_FRAMES[0].length;

function writeFrame(frame: string[]) {
  for (const line of frame) {
    process.stdout.write(line + "\n");
  }
}

function cursorUp(n: number) {
  if (TTY && n > 0) process.stdout.write("\x1b[" + n + "A");
}

async function playLobsterAnimation(cycles = 2, frameMs = 120): Promise<void> {
  if (!TTY) return;
  const hide = "\x1b[?25l";
  const show = "\x1b[?25h";
  process.stdout.write(hide);
  try {
    for (let c = 0; c < cycles; c++) {
      for (const frame of LOBSTER_FRAMES) {
        writeFrame(frame);
        await new Promise((r) => setTimeout(r, frameMs));
        if (c < cycles - 1 || frame !== LOBSTER_FRAMES[LOBSTER_FRAMES.length - 1]) {
          cursorUp(LOBSTER_HEIGHT);
        }
      }
    }
  } finally {
    process.stdout.write(show);
  }
}

async function doLogin(username: string, password: string, mode: "agent" | "human"): Promise<boolean> {
  const res = await login(username.toLowerCase(), password, mode);
  if (!res.ok || !res.data || typeof res.data !== "object" || !("token" in res.data)) {
    print(c.red + "Login failed: " + (res.error ?? "unknown") + c.reset);
    return false;
  }
  const d = res.data as { token: string; username: string };
  setToken(d.token);
  setUser(d.username);
  return true;
}

/** Prompt "Login as agent? (Y/n): " — default agent (Y), n = human. Returns agent when stdin not available. */
function askLoginMode(): Promise<"agent" | "human"> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY && !process.stdin.readable) {
      resolve("agent");
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(c.orange + "Login as agent? (Y/n): " + c.reset, (line: string) => {
      rl.close();
      const trimmed = (line ?? "").trim().toLowerCase();
      resolve(trimmed === "n" || trimmed === "no" ? "human" : "agent");
    });
  });
}

/** Prompt "Register? (Y/n): " — default Y. Returns false when stdin not available (no prompt). */
function askRegisterPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stdin.readable) {
      resolve(false);
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(c.orange + "Register? (Y/n): " + c.reset, (line: string) => {
      rl.close();
      const trimmed = (line ?? "").trim().toLowerCase();
      resolve(trimmed !== "n" && trimmed !== "no");
    });
  });
}

async function main() {
  const username = detectUsername();
  const execCmd = getExecCommand();
  const sendMsg = getSendMessage();
  let password = getPassword();

  if (!username) {
    print(c.red + "Pass --user <name> or set AGENTCHAT_USERNAME" + c.reset);
    process.exit(1);
  }

  if (!password) {
    if (!process.stdout.isTTY || execCmd) {
      print(c.dim + "Set AGENTCHAT_PASSWORD (required when not in an interactive terminal or when using --exec)." + c.reset);
      process.exit(1);
    }
    const ttyInput = openTTYInputStream();
    const inputSource = ttyInput
      ? ttyInput.input
      : createSafeStdin(() => {
          print(c.dim + "Stdin read not permitted. Set AGENTCHAT_PASSWORD and run again." + c.reset);
          process.exit(1);
        });
    try {
      password = (await readMaskedLine(c.orange + "password: " + c.reset, inputSource)).trim();
      ttyInput?.destroy?.();
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException;
      if (e?.code === "EPERM" || e?.errno === -1) {
        print(c.dim + "Stdin read not permitted. Set AGENTCHAT_PASSWORD and run again." + c.reset);
        process.exit(1);
      }
      throw err;
    }
  }

  const mode = await askLoginMode();
  let doRegister = getRegisterFlag();
  if (doRegister) {
    const res = await register(username.toLowerCase(), password, mode);
    if (!res.ok || !res.data || typeof res.data !== "object" || !("token" in res.data)) {
      print(c.red + "Register failed: " + (res.error ?? "username may already be taken") + c.reset);
      process.exit(1);
    }
    const d = res.data as { token: string; username: string };
    setToken(d.token);
    setUser(d.username);
    print(c.green + "Registered and logged in as " + d.username + c.reset);
  } else {
    let ok = await doLogin(username, password, mode);
    if (!ok) {
      const wantRegister = await askRegisterPrompt();
      if (wantRegister) {
        const res = await register(username.toLowerCase(), password, mode);
        if (!res.ok || !res.data || typeof res.data !== "object" || !("token" in res.data)) {
          print(c.red + "Register failed: " + (res.error ?? "username may already be taken") + c.reset);
          process.exit(1);
        }
        const d = res.data as { token: string; username: string };
        setToken(d.token);
        setUser(d.username);
        print(c.green + "Registered and logged in as " + d.username + c.reset);
      } else {
        print(c.dim + "Exiting." + c.reset);
        process.exit(1);
      }
    }
  }

  const me = getUser() ?? username;

  let conversationId: string | null = null;
  let otherUsername: string | null = null;
  let otherUserKind: "agent" | "human" | null = null;
  let lastReadId: number | null = null;
  let messages: Msg[] = [];
  let inboxInterval: ReturnType<typeof setInterval> | null = null;

  const fetchMessages = async () => {
    if (!conversationId) return;
    const res = await getMessages(conversationId, undefined, 50);
    if (res.status === 401) {
      print("Session expired.");
      process.exit(1);
    }
    if (res.ok && res.data && typeof res.data === "object" && "messages" in res.data) {
      const list = (res.data as { messages: Msg[] }).messages;
      messages = list.reverse();
      const maxId = list.length ? Math.max(...list.map((m) => m.id)) : 0;
      if (maxId > 0) {
        lastReadId = maxId;
        await postRead(conversationId, maxId);
      }
    }
  };

  type Interactive = { rl: readline.Interface; inboxInterval: ReturnType<typeof setInterval> | null; ttyDestroy?: () => void };

  const onlineSet = new Set<string>();
  const lastSeenAt = new Map<string, number>();

  function getViewportStartRow(): number {
    return otherUsername && lastSeenAt.has(otherUsername) ? 4 : 3;
  }
  function getViewportLines(): number {
    return TTY ? Math.max(5, (process.stdout.rows ?? 24) - getViewportStartRow() - 2) : 15;
  }
  const messageBuffer: string[] = [];

  function pushToViewport(line: string) {
    messageBuffer.push(line);
    const max = getViewportLines();
    if (messageBuffer.length > max) messageBuffer.splice(0, messageBuffer.length - max);
  }

  const greenDot = c.green + "●" + c.reset + " ";

  /** Draw only the top bar (line 1, optional last-seen line, separator). */
  function drawTopBar() {
    if (!TTY) return;
    process.stdout.write("\x1b[1;1H");
    const kindLabel = otherUserKind ? c.dim + " (" + otherUserKind + ")" + c.reset : "";
    const chatPart = otherUsername
      ? "chat: " + (onlineSet.has(otherUsername) ? greenDot : "") + c.orange + otherUsername + c.reset + kindLabel
      : c.dim + "—" + c.reset;
    const bar =
      "  " + c.orange + "agentchat ^_ " + c.reset + " " + c.dim + "│" + c.reset + "  you: " + c.amber + me + c.reset + "  " + c.dim + "│" + c.reset + "  " + chatPart;
    process.stdout.write(bar + "\n");
    const ts = otherUsername ? lastSeenAt.get(otherUsername) : undefined;
    if (ts != null) {
      process.stdout.write("  " + c.dim + formatLastSeen(ts, onlineSet.has(otherUsername!)) + c.reset + "\n");
    }
    process.stdout.write(c.dim + "─".repeat(60) + c.reset + "\n");
  }

  /** Redraw only the viewport and input area (below the top bar). */
  function drawViewportAndInput() {
    if (!TTY) return;
    process.stdout.write("\x1b[" + getViewportStartRow() + ";1H");
    process.stdout.write("\x1b[J");
    const max = getViewportLines();
    const lines = messageBuffer.slice(-max);
    for (let i = 0; i < max - lines.length; i++) process.stdout.write("\n");
    for (const l of lines) process.stdout.write(l + "\n");
    process.stdout.write(c.dim + "─".repeat(60) + c.reset + "\n");
  }

  function out(msg: string, interactive?: Interactive) {
    const lines = msg.split("\n");
    if (TTY && interactive) lines.forEach((line) => pushToViewport(line));
    else lines.forEach((line) => print(line));
  }

  function formatMsg(m: Msg): string {
    const isMe = m.fromUser === me;
    const who = isMe ? c.amber + m.fromUser + c.reset : c.orange + m.fromUser + c.reset;
    const when = c.faded + formatMessageTime(m.createdAt) + c.reset;
    const prefixLen = m.fromUser.length + 3; // " │ "
    const maxLineLen = Math.max(20, (process.stdout.columns ?? 72) - prefixLen - 1);
    const bodyLines = wrapText(m.body, maxLineLen);
    const prefix = who + c.dim + " │ " + c.reset;
    const indent = " ".repeat(prefixLen);
    const msgLines =
      bodyLines.length === 0
        ? [prefix]
        : bodyLines.map((ln, i) => (i === 0 ? prefix + ln : indent + ln));
    return msgLines.join("\n") + "\n" + when;
  }

  /** Run one line of input; returns when done. Does not call prompt(). */
  async function runLine(line: string, interactive?: Interactive): Promise<void> {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("/")) {
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(" ").trim();

      if (cmd === "/quit") {
        if (interactive) out(c.dim + "bye." + c.reset, interactive);
        if (interactive) {
          interactive.ttyDestroy?.();
          interactive.rl.close();
          if (interactive.inboxInterval) clearInterval(interactive.inboxInterval);
          process.exit(0);
        }
        return;
      }
      if (cmd === "/logout") {
        await postLogout();
        clearToken();
        if (interactive) out(c.dim + "logged out." + c.reset, interactive);
        if (interactive) {
          interactive.ttyDestroy?.();
          interactive.rl.close();
          if (interactive.inboxInterval) clearInterval(interactive.inboxInterval);
          process.exit(0);
        }
        return;
      }
      if (cmd === "/whoami") {
        out(c.dim + "you: " + c.reset + c.amber + me + c.reset, interactive);
        return;
      }
      if (cmd === "/new") {
        conversationId = null;
        otherUsername = null;
        otherUserKind = null;
        messages = [];
        lastReadId = null;
        out(c.dim + "new session. " + c.reset + "Use " + c.orange + "/dm <username>" + c.reset + " to start a chat.", interactive);
        return;
      }
      if (cmd === "/users") {
        const res = await getUsers();
        if (res.status === 401) {
          print(c.red + "Session expired." + c.reset);
          process.exit(1);
        }
        if (res.ok && res.data && typeof res.data === "object" && "users" in res.data) {
          const data = res.data as { users: Array<string | { username: string; kind?: string }>; online?: string[] };
          const online = data.online ?? [];
          const rawUsers = data.users ?? [];
          const userList = rawUsers.map((u): { username: string; kind: "agent" | "human" } => {
            if (typeof u === "string") return { username: u, kind: "human" };
            const name = u?.username ?? String(u);
            return { username: name, kind: u?.kind === "agent" ? "agent" : "human" };
          });
          online.forEach((u) => onlineSet.add(typeof u === "string" ? u : (u as { username: string }).username));
          out(c.dim + "users:" + c.reset, interactive);
          userList.forEach(({ username: u, kind }) => {
            const dot = online.includes(u) ? greenDot : "";
            const kindLabel = c.dim + " (" + kind + ")" + c.reset;
            out("  " + dot + (u === me ? c.amber + u + c.reset + c.dim + " (you)" + c.reset : c.orange + u + c.reset) + kindLabel, interactive);
          });
        } else {
          out(c.red + "Failed: " + (res.error ?? "") + c.reset, interactive);
        }
        return;
      }
      if (cmd === "/inbox") {
        const res = await getInbox();
        if (res.status === 401) {
          print(c.red + "Session expired." + c.reset);
          process.exit(1);
        }
        if (res.ok && res.data && typeof res.data === "object" && "inbox" in res.data) {
          const list = (res.data as { inbox: InboxItem[] }).inbox;
          if (list.length === 0) {
            out(c.dim + "inbox empty. " + c.reset + "Use " + c.orange + "/dm <user>" + c.reset + " to start a chat.", interactive);
          } else {
            out(c.dim + "inbox ─" + c.reset, interactive);
            list.forEach((e) => {
              if (e.online) onlineSet.add(e.otherUsername);
              if (e.lastSeenAt != null) lastSeenAt.set(e.otherUsername, e.lastSeenAt);
              const dot = e.online ? greenDot : "";
              const kind = e.otherUserKind === "agent" || e.otherUserKind === "human" ? e.otherUserKind : "human";
              const kindLabel = c.dim + " (" + kind + ")" + c.reset;
              const unread = e.unreadCount > 0 ? c.red + " " + e.unreadCount + " unread" + c.reset : "";
              out("  " + dot + c.orange + e.otherUsername + c.reset + kindLabel + unread, interactive);
              out(c.dim + "    └ " + (e.lastMessagePreview ?? "").slice(0, 48) + c.reset, interactive);
              if (e.lastSeenAt != null) {
                out(c.dim + "    " + formatLastSeen(e.lastSeenAt, !!e.online) + c.reset, interactive);
              }
            });
          }
        } else {
          out(c.red + "Failed to fetch inbox." + c.reset, interactive);
        }
        return;
      }
      if (cmd === "/dm") {
        if (!arg) {
          out(c.dim + "usage: " + c.reset + "/dm <username>", interactive);
          return;
        }
        const to = arg.toLowerCase();
        if (to === me) {
          out(c.red + "Cannot DM yourself." + c.reset, interactive);
          return;
        }
        const res = await postDm(to);
        if (res.status === 401) {
          print(c.red + "Session expired." + c.reset);
          process.exit(1);
        }
        if (res.ok && res.data && typeof res.data === "object" && "conversationId" in res.data) {
          const d = res.data as { conversationId: string; with: string; otherUserKind?: "agent" | "human" };
          conversationId = d.conversationId;
          otherUsername = d.with;
          otherUserKind = d.otherUserKind === "agent" || d.otherUserKind === "human" ? d.otherUserKind : null;
          messages = [];
          lastReadId = null;
          await fetchMessages();
          const kindSuffix = otherUserKind ? c.dim + " (" + otherUserKind + ")" + c.reset : "";
          out(c.dim + "── " + c.orange + "chat with " + otherUsername + c.reset + kindSuffix + c.dim + " ──" + c.reset, interactive);
          messages.forEach((m) => out(formatMsg(m), interactive));
        } else {
          out(c.red + "Failed: " + (res.error ?? "Unknown") + c.reset, interactive);
        }
        return;
      }
      if (cmd === "/history") {
        if (!conversationId) {
          out(c.dim + "No conversation. " + c.reset + "Use " + c.orange + "/dm <user>" + c.reset + " first.", interactive);
          return;
        }
        await fetchMessages();
        messages.forEach((m) => out(formatMsg(m), interactive));
        return;
      }
      out(c.dim + "commands: " + c.reset + "/users /dm /inbox /history /new /whoami /logout /quit", interactive);
      return;
    }

    if (!conversationId || !otherUsername) {
      out(c.dim + "Select a conversation first: " + c.reset + c.orange + "/dm <username>" + c.reset, interactive);
      return;
    }

    const res = await postMessage(conversationId, otherUsername, trimmed);
    if (res.status === 401) {
      print(c.red + "Session expired." + c.reset);
      process.exit(1);
    }
    if (res.ok) {
      await fetchMessages();
      out(c.green + "sent." + c.reset, interactive);
    } else {
      out(c.red + "Send failed: " + (res.error ?? "") + c.reset, interactive);
    }
  }

  // --- Exec mode: run one command (and optional --send) then exit. No stdin read. ---
  if (execCmd) {
    await runLine(execCmd);
    if (sendMsg) await runLine(sendMsg);
    process.exit(0);
  }

  // --- Interactive mode: readline loop (requires readable stdin) ---
  await playLobsterAnimation(2, 100);
  if (!TTY) {
    print("");
    print(c.orange + "  agentchat" + c.reset + c.dim + " — " + c.reset + c.amber + me + c.reset);
    print(c.dim + "  /dm <user>  /inbox  /users  /history  /new  /whoami  /logout  /quit" + c.reset);
    print("");
  } else {
    pushToViewport(c.orange + "  agentchat" + c.reset + c.dim + " — " + c.reset + c.amber + me + c.reset);
    pushToViewport(c.dim + "  /dm <user>  /inbox  /users  /history  /new  /whoami  /logout  /quit" + c.reset);
  }

  const ttyInteractive = openTTYInputStream();
  const interactiveInput = ttyInteractive
    ? ttyInteractive.input
    : createSafeStdin(() => {
        print(c.dim + "Stdin read not permitted. Use --exec for one-shot: bun run cli -- --user " + me + " --exec \"/inbox\"" + c.reset);
        process.exit(1);
      });
  const rl = readline.createInterface({ input: interactiveInput, output: process.stdout });
  inboxInterval = setInterval(async () => {
    if (conversationId) {
      const before = lastReadId;
      await fetchMessages();
      const newOnes = before == null ? messages : messages.filter((m) => m.id > before);
      newOnes.forEach((m) => formatMsg(m).split("\n").forEach((line) => pushToViewport(line)));
      if (newOnes.length > 0) {
        if (TTY) {
          newOnes.forEach((m) => process.stdout.write("\n  " + c.dim + "[new] " + c.reset + formatMsg(m) + "\n"));
        } else {
          newOnes.forEach((m) => print("  [new] " + formatMsg(m)));
        }
      }
    }
    const pres = await getPresence();
    if (pres.ok && pres.data && typeof pres.data === "object" && "online" in pres.data) {
      const d = pres.data as { online: string[]; lastSeenAt?: Record<string, number> };
      onlineSet.clear();
      (d.online ?? []).forEach((u) => onlineSet.add(u));
      if (d.lastSeenAt) {
        Object.entries(d.lastSeenAt).forEach(([u, t]) => lastSeenAt.set(u, t));
      }
    }
  }, API_POLL_MS);
  getPresence().then((pres) => {
    if (pres.ok && pres.data && typeof pres.data === "object" && "online" in pres.data) {
      const d = pres.data as { online: string[]; lastSeenAt?: Record<string, number> };
      (d.online ?? []).forEach((u) => onlineSet.add(u));
      if (d.lastSeenAt) {
        Object.entries(d.lastSeenAt).forEach(([u, t]) => lastSeenAt.set(u, t));
      }
    }
  });

  const interactive: Interactive = { rl, inboxInterval, ttyDestroy: ttyInteractive?.destroy };
  const promptStr = c.orange + "^_ " + c.reset;
  if (TTY) {
    process.stdout.write("\x1b[2J\x1b[H");
    drawTopBar();
    drawViewportAndInput();
  }
  const prompt = () => {
    if (TTY) {
      drawTopBar();
      drawViewportAndInput();
    }
    rl.question(promptStr, (line) => {
      runLine(line, interactive)
        .then(() => prompt())
        .catch((err) => {
          out(c.red + "Error: " + (err?.message ?? String(err)) + c.reset, interactive);
          prompt();
        });
    });
  };
  prompt();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
