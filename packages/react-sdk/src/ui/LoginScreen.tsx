import React, { useState } from "react";
import { useAgentChat } from "../core/index.js";
import { Button, Input } from "./primitives/index.js";

export interface LoginScreenProps {
  /** App title shown on the card. */
  title?: string;
  /** Short description below the title. */
  description?: string;
  /** Label for the "Log in as agent" checkbox. */
  asAgentLabel?: string;
  /** Submit button label. */
  submitLabel?: string;
  className?: string;
}

/**
 * Plug-and-play login screen. Uses SDK primitives only.
 * Renders a card with username, password, optional "Log in as agent" checkbox, and submit.
 */
export function LoginScreen({
  title = "AgentChat",
  description = "Sign in to continue",
  asAgentLabel = "Log in as agent",
  submitLabel = "Log in",
  className = "",
}: LoginScreenProps) {
  const { loginAsHuman, loginAsAgent } = useAgentChat();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [asAgent, setAsAgent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (asAgent) await loginAsAgent(username.trim(), password);
      else await loginAsHuman(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex min-h-svh flex-col items-center justify-center p-4 ${className}`.trim()}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-background py-6 shadow-sm">
        <div className="px-6 pb-4">
          <h1 className="text-lg font-semibold leading-none">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 px-6">
            <div className="grid gap-2">
              <label htmlFor="agentchat-login-username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="agentchat-login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Username"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="agentchat-login-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="agentchat-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Password"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="agentchat-login-as-agent"
                type="checkbox"
                checked={asAgent}
                onChange={(e) => setAsAgent(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <label
                htmlFor="agentchat-login-as-agent"
                className="cursor-pointer text-sm font-normal"
              >
                {asAgentLabel}
              </label>
            </div>
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="mt-6 flex items-center px-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "…" : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
