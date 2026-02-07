/**
 * Read a password with masking (echo *) from a TTY stream.
 * Uses raw mode and echoes '*' for each character. Backspace and Enter supported.
 * When the given stream has no setRawMode (e.g. fs.createReadStream("/dev/tty")),
 * tries to open /dev/tty via tty.ReadStream so masking works in CLI mode.
 * @param prompt - Prompt string to display
 * @param inputStream - Optional stream to read from (default: process.stdin). Use for /dev/tty when stdin isn't the TTY.
 */

import * as fs from "node:fs";
import * as readline from "node:readline";
import * as tty from "node:tty";

type TTYReadStream = NodeJS.ReadStream & { setRawMode?: (v: boolean) => void };

function doMaskedRead(stream: TTYReadStream): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write("");
    let buffer = "";
    const onData = (chunk: Buffer | string) => {
      const s = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        const code = s.charCodeAt(i);
        if (c === "\n" || c === "\r") {
          stream.removeListener("data", onData);
          stream.setRawMode?.(false);
          stream.pause();
          process.stdout.write("\n");
          resolve(buffer);
          return;
        }
        if (code === 3) {
          stream.removeListener("data", onData);
          stream.setRawMode?.(false);
          stream.pause();
          process.stdout.write("\n");
          process.exit(130);
          return;
        }
        if (c === "\x7f" || c === "\b") {
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (code >= 32 && code < 127) {
          buffer += c;
          process.stdout.write("*");
        }
      }
    };
    stream.setRawMode?.(true);
    stream.resume();
    stream.on("data", onData);
  });
}

function unmaskedFallback(stream: NodeJS.ReadStream, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: stream, output: process.stdout });
    rl.question(prompt, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
    rl.on("error", reject);
  });
}

export function readMaskedLine(prompt: string, inputStream?: NodeJS.ReadStream): Promise<string> {
  const stream = (inputStream ?? process.stdin) as TTYReadStream;

  if (stream.isTTY && typeof stream.setRawMode === "function") {
    process.stdout.write(prompt);
    return doMaskedRead(stream);
  }

  // CLI often uses fs.createReadStream("/dev/tty") which has no setRawMode. Try tty.ReadStream so we can mask.
  if (process.platform !== "win32" && process.stdout.isTTY) {
    try {
      const fd = fs.openSync("/dev/tty", "r");
      const ttyStream = new tty.ReadStream(fd);
      ttyStream.setRawMode(true);
      process.stdout.write(prompt);
      const p = doMaskedRead(ttyStream as TTYReadStream).finally(() => {
        ttyStream.setRawMode(false);
        ttyStream.destroy(); // closes fd internally; do not close fd again
      });
      return p;
    } catch {
      /* fall through to unmasked */
    }
  }

  return unmaskedFallback(stream, prompt);
}
