import process from "node:process";
import React from "react";
import { render } from "ink";
import { App } from "./App.js";

// Use readline-based CLI when stdin can't do raw mode (e.g. SSH with EPERM).
// Run: bun run tui -- --simple --user cursor
if (process.argv.includes("--simple")) {
  import("./simple-cli.js");
} else {
  // Line-input mode: same UI as TUI but input via readline (line + Enter), works over SSH.
  const lineInputMode = process.argv.includes("--line-input");
  if (lineInputMode) {
    process.env.AGENTCHAT_LINE_INPUT = "1";
    // If stdin isn't a TTY, readline won't work. Require env login so we can fail fast with a clear message.
    const envUser = (process.env.AGENT_USERNAME ?? process.env.AGENTCHAT_USERNAME ?? "").trim();
    const envPass = (process.env.AGENT_PASSWORD ?? process.env.AGENTCHAT_PASSWORD ?? "").trim();
    const suggestedUser = (() => {
      const argv = process.argv.slice(2);
      const i = argv.indexOf("--user");
      return i !== -1 && argv[i + 1] ? argv[i + 1].trim() : "";
    })();
    const haveUser = !!envUser || !!suggestedUser;
    if (!process.stdin.isTTY && !(haveUser && envPass)) {
      console.error("\nInteractive input not available (stdin is not a TTY).");
      console.error("Use env vars to login without a prompt:");
      console.error("  AGENTCHAT_USERNAME and AGENTCHAT_PASSWORD");
      console.error("  or: --user <username> with AGENTCHAT_PASSWORD");
      process.exit(1);
    }
    // Catch EPERM from any layer (e.g. Bun/libuv read on fd 0) so we can show a clear message.
    process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
      if (err?.code === "EPERM" || err?.errno === -1) {
        console.error("\nInteractive input not available (stdin read failed).");
        console.error("Use AGENTCHAT_USERNAME and AGENTCHAT_PASSWORD, or --user <name> with AGENTCHAT_PASSWORD.");
        process.exit(1);
      }
      throw err;
    });
  }

  // Stub stdin for line-input mode: Ink renders but doesn't read (readline does).
  const realStdin = process.stdin;
  const stubStdin = {
    isTTY: true,
    setRawMode(_mode: boolean) {},
    setEncoding(_enc: BufferEncoding) {},
    ref() {},
    unref() {},
    addListener() {
      return stubStdin as NodeJS.ReadStream;
    },
    removeListener() {
      return stubStdin as NodeJS.ReadStream;
    },
    on() {
      return stubStdin as NodeJS.ReadStream;
    },
    off() {
      return stubStdin as NodeJS.ReadStream;
    },
    read() {
      return null;
    },
  };

  const safeStdin = {
    get isTTY() {
      return realStdin.isTTY;
    },
    setRawMode(mode: boolean) {
      realStdin.setRawMode(mode);
    },
    setEncoding(enc: BufferEncoding) {
      realStdin.setEncoding(enc);
    },
    ref() {
      realStdin.ref();
    },
    unref() {
      realStdin.unref();
    },
    addListener(...args: Parameters<typeof realStdin.addListener>) {
      return realStdin.addListener(...args);
    },
    removeListener(...args: Parameters<typeof realStdin.removeListener>) {
      return realStdin.removeListener(...args);
    },
    on(...args: Parameters<typeof realStdin.on>) {
      return realStdin.on(...args);
    },
    off(...args: Parameters<typeof realStdin.off>) {
      return realStdin.off(...args);
    },
    read(...args: Parameters<typeof realStdin.read>) {
      try {
        return realStdin.read(...args);
      } catch (err: unknown) {
        const e = err as NodeJS.ErrnoException;
        if (e?.code === "EPERM" || e?.errno === -1) {
          return null;
        }
        throw err;
      }
    },
  };

  const stdin = lineInputMode ? (stubStdin as NodeJS.ReadStream) : safeStdin;
  render(React.createElement(App), { stdin });
}
