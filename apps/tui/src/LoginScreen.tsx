import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { login, register, setToken, setUser } from "./api.js";
import { isLineInputMode, setLineInputContext } from "./line-input.js";

type Mode = "login" | "register";

export function LoginScreen({
  onLoggedIn,
  suggestedUsername = "",
}: {
  onLoggedIn: (username: string) => void;
  suggestedUsername?: string;
}) {
  const { exit } = useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState(suggestedUsername);
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"user" | "pass">("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useInput((input, key) => {
    if (key.escape) exit();
    if (key.tab) {
      setMode((m) => (m === "login" ? "register" : "login"));
      setError("");
    }
  });

  // Line-input mode: readline prompts instead of TextInput (works over SSH).
  useEffect(() => {
    if (!isLineInputMode()) return;
    if (step === "user") {
      setLineInputContext({
        prompt: "Username: ",
        handle: (u) => {
          setUsername(u);
          setStep("pass");
          setError("");
        },
      });
    } else {
      setLineInputContext({
        prompt: "Password: ",
        handle: (p) => submitPass(p),
      });
    }
    return () => setLineInputContext(null);
  }, [step, mode]);

  const submitUser = () => {
    if (!username.trim()) return;
    setStep("pass");
    setError("");
  };

  const submitPass = async (pwd?: string) => {
    const pass = (pwd ?? password).trim();
    if (!pass) return;
    setError("");
    setLoading(true);
    const fn = mode === "login" ? login : register;
    const res = await fn(username.trim().toLowerCase(), pass);
    setLoading(false);
    if (res.ok && res.data && typeof res.data === "object" && "token" in res.data) {
      const d = res.data as { token: string; username: string };
      setToken(d.token);
      setUser(d.username);
      onLoggedIn(d.username);
    } else {
      setError(res.error ?? "Failed");
    }
  };

  return (
    <Box flexDirection="column" paddingY={1} paddingX={2}>
      <Text bold>Agent Chat — {mode === "login" ? "Login" : "Register"}</Text>
      <Box marginTop={1}>
        <Text dimColor>Plain text only, no markdown.</Text>
      </Box>
      {step === "user" ? (
        <Box marginTop={1}>
          <Text>Username: </Text>
          {isLineInputMode() ? (
            <Text dimColor>(type and press Enter)</Text>
          ) : (
            <TextInput
              value={username}
              onChange={setUsername}
              onSubmit={submitUser}
              placeholder="username"
            />
          )}
        </Box>
      ) : (
        <Box marginTop={1}>
          <Text>Password: </Text>
          {isLineInputMode() ? (
            <Text dimColor>(type and press Enter)</Text>
          ) : (
            <TextInput
              value={password}
              onChange={setPassword}
              onSubmit={() => submitPass()}
              placeholder="password"
              mask="*"
            />
          )}
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>
          Tab = switch Login/Register · Esc = quit
        </Text>
      </Box>
      {error ? (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      ) : null}
      {loading ? (
        <Box marginTop={1}>
          <Text dimColor>...</Text>
        </Box>
      ) : null}
    </Box>
  );
}
