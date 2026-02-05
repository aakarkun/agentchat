import React, { useState, useEffect } from "react";
import { useApp } from "ink";
import { LoginScreen } from "./LoginScreen.js";
import { ChatScreen } from "./ChatScreen.js";
import { getToken, getUser, setUser, setToken, clearToken, login } from "./api.js";

function getEnvPassword(): string {
  return (process.env.AGENT_PASSWORD ?? process.env.AGENTCHAT_PASSWORD ?? "").trim();
}

function AppContent({ suggestedUsername }: { suggestedUsername: string }) {
  const [me, setMe] = useState<string | null>(getUser());
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token && !getUser()) {
      clearToken();
      setMe(null);
      setChecked(true);
      return;
    }
    if (token) {
      setMe(getUser());
      setChecked(true);
      return;
    }
    // Non-interactive login: use env so SSH/restricted TTY can skip LoginScreen
    const envUser = (process.env.AGENT_USERNAME ?? process.env.AGENTCHAT_USERNAME ?? "").trim() || suggestedUsername;
    const envPass = getEnvPassword();
    if (envUser && envPass) {
      login(envUser.toLowerCase(), envPass)
        .then((res) => {
          if (res.ok && res.data && typeof res.data === "object" && "token" in res.data) {
            const d = res.data as { token: string; username: string };
            setToken(d.token);
            setUser(d.username);
            setMe(d.username);
            setChecked(true);
          } else {
            // Line-input mode: never show LoginScreen when env login was used (stdin may be unusable).
            if (process.env.AGENTCHAT_LINE_INPUT === "1") {
              console.error("\nEnv login failed:", res.error ?? "Invalid credentials or API not running.");
              console.error("Check AGENTCHAT_PASSWORD and that the API is running (bun run api).");
              process.exit(1);
            }
            setChecked(true);
          }
        })
        .catch((err) => {
          if (process.env.AGENTCHAT_LINE_INPUT === "1") {
            console.error("\nEnv login failed:", err instanceof Error ? err.message : "Network error");
            console.error("Is the API running? Start it with: bun run api");
            process.exit(1);
          }
          setChecked(true);
        });
    } else {
      setChecked(true);
    }
  }, [suggestedUsername]);

  const handleLoggedIn = (username: string) => {
    setUser(username);
    setMe(username);
  };

  const handleUnauthorized = () => {
    clearToken();
    setMe(null);
  };

  if (!checked) return null;
  if (!getToken() || !me) {
    return (
      <LoginScreen
        onLoggedIn={handleLoggedIn}
        suggestedUsername={suggestedUsername}
      />
    );
  }
  return <ChatScreen me={me} onUnauthorized={handleUnauthorized} />;
}

function detectUsername(): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--user");
  if (i !== -1 && argv[i + 1]) return argv[i + 1].trim();
  if (process.env.AGENT_USERNAME) return process.env.AGENT_USERNAME.trim();
  if (process.env.USER) return process.env.USER;
  if (process.env.LOGNAME) return process.env.LOGNAME;
  return "";
}

export function App() {
  return <AppContent suggestedUsername={detectUsername()} />;
}
