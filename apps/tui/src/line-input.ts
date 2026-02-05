/**
 * Line-based input for when raw TTY mode isn't allowed (e.g. SSH EPERM).
 * Same style as Cursor CLI: you type a line and press Enter.
 */

import * as readline from "node:readline";

export type LineInputContext = {
  prompt: string;
  handle: (line: string) => void | Promise<void>;
};

let currentContext: LineInputContext | null = null;
let rl: readline.Interface | null = null;
let loopRunning = false;
let stdinError: Error | null = null;

export function isLineInputMode(): boolean {
  return process.env.AGENTCHAT_LINE_INPUT === "1";
}

export function setLineInputContext(ctx: LineInputContext | null): void {
  currentContext = ctx;
  if (ctx && !loopRunning) {
    loopRunning = true;
    runLoop();
  }
}

/** stdin with read() wrapped to catch EPERM; use this so we don't break readline's flow. */
function safeStdinForReadline(): NodeJS.ReadStream {
  const raw = process.stdin;
  const safe = Object.create(raw, {
    read: {
      value(this: NodeJS.ReadStream, size?: number) {
        try {
          return raw.read(size);
        } catch (err: unknown) {
          const e = err as NodeJS.ErrnoException;
          if (e?.code === "EPERM" || e?.errno === -1) {
            stdinError = e;
            process.nextTick(() => {
              console.error("\nInput read failed (stdin not readable in this terminal).");
              console.error("Your terminal or SSH session may not allow keyboard input. Try a different terminal.");
              setTimeout(() => process.exit(1), 500);
            });
            return null;
          }
          throw err;
        }
      },
    },
  });
  raw.on("error", (err: NodeJS.ErrnoException) => {
    if (err?.code === "EPERM" || err?.errno === -1) {
      stdinError = err;
      console.error("\nInput read failed (stdin not readable in this terminal).");
      console.error("Your terminal or SSH session may not allow keyboard input. Try a different terminal.");
      setTimeout(() => process.exit(1), 500);
    }
  });
  return safe as NodeJS.ReadStream;
}

function getReadline(): readline.Interface | null {
  if (stdinError) return null;
  if (!rl) {
    rl = readline.createInterface({
      input: safeStdinForReadline(),
      output: process.stdout,
    });
  }
  return rl;
}

function runLoop(): void {
  const ctx = currentContext;
  if (!ctx) return;
  const interface_ = getReadline();
  if (!interface_) return;
  interface_.question(ctx.prompt, (line) => {
    Promise.resolve(ctx.handle(line.trim())).then(
      () => {
        runLoop();
      },
      () => {
        runLoop();
      }
    );
  });
}
