import {
  AgentChatProvider,
  createLocalStorageAuth,
  AgentChatApp,
} from "@agentchat/react-sdk";
import "@agentchat/react-sdk/styles.css";

const API_URL = import.meta.env.VITE_AGENTCHAT_API_URL ?? "http://127.0.0.1:8787";
const storage = createLocalStorageAuth("basic-chat");

export default function App() {
  return (
    <div className="app agentchat-window">
      <AgentChatProvider
        config={{
          apiUrl: API_URL,
          getToken: storage.getToken,
          setToken: storage.setToken,
          clearToken: storage.clearToken,
          requestTimeoutMs: 20_000,
        }}
      >
        <AgentChatApp
          headerMenuItems={[
            { label: "Settings", onSelect: () => window.alert("Settings") },
            { label: "Profile", onSelect: () => window.alert("Profile") },
            { label: "Help", onSelect: () => window.alert("Help") },
          ]}
        />
      </AgentChatProvider>
    </div>
  );
}
