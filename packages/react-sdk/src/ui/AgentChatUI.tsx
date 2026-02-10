import React from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
  ConversationSkeleton,
} from "./conversation/index.js";
import { ChatMessage } from "./message/index.js";
import { PromptInput } from "./prompt-input/index.js";
import { useAgentChatSource } from "./adapters/index.js";
import type { ChatSource } from "./types.js";
import type { PromptInputMode } from "./prompt-input/index.js";

/** Config for the prompt input bar (attachment, LLM usage, placeholder). */
export interface AgentChatUIPromptConfig {
  placeholder?: string;
  /** Show attachment (+) button. */
  showAttachment?: boolean;
  onAttachmentClick?: () => void;
  /** Only when inputMode is "llm": label for auto mode (default "Auto"). */
  autoLabel?: string;
  /** Only when inputMode is "llm": e.g. "52% used". */
  usageLabel?: string;
}

export interface AgentChatUIProps {
  /** AgentChat channel (conversation) ID. When provided, uses REST API via useAgentChatSource. */
  channelId?: string;
  /** Injected chat source (e.g. from createLLMChatSource). When provided, channelId is ignored. */
  chatSource?: ChatSource;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** "llm" shows Auto + usage in input footer; "agentchat" does not. Default: "llm" when chatSource is injected, "agentchat" when using channelId. */
  promptInputMode?: PromptInputMode;
  /** Prompt input config (placeholder, attachment, usage label). */
  promptConfig?: AgentChatUIPromptConfig;
}

/**
 * Default chat UI: accepts either channelId (AgentChat REST) or chatSource (e.g. LLM).
 * Renders Conversation + Message list + PromptInput.
 */
export function AgentChatUI({
  channelId,
  chatSource: injectedSource,
  className = "",
  emptyTitle,
  emptyDescription,
  promptInputMode: promptInputModeProp,
  promptConfig,
}: AgentChatUIProps) {
  const agentChatSource = useAgentChatSource(channelId ?? "");
  const chatSource = injectedSource ?? (channelId ? agentChatSource : null);
  const isLLMSource = injectedSource != null;
  const promptInputMode =
    promptInputModeProp ?? (isLLMSource ? "llm" : "agentchat");

  if (!chatSource) {
    return (
      <div className={`flex flex-1 flex-col min-h-0 px-4 py-4 text-muted-foreground ${className}`.trim()}>
        Provide channelId or chatSource to render the chat.
      </div>
    );
  }

  const { messages, sendMessage, status } = chatSource;
  const loading = status === "submitted" && messages.length === 0;

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`.trim()}>
      <Conversation>
        <ConversationContent>
          {loading ? (
            <ConversationSkeleton />
          ) : messages.length === 0 ? (
            <ConversationEmptyState
              title={emptyTitle}
              description={emptyDescription}
            />
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton visible={!loading && messages.length > 0} />
      </Conversation>
      <PromptInput
        onSubmit={sendMessage}
        status={status}
        placeholder={promptConfig?.placeholder ?? "Ask, Search or Chat…"}
        disabled={status !== "ready"}
        inputMode={promptInputMode}
        showAttachment={promptConfig?.showAttachment ?? false}
        onAttachmentClick={promptConfig?.onAttachmentClick}
        autoLabel={promptConfig?.autoLabel}
        usageLabel={promptConfig?.usageLabel}
      />
    </div>
  );
}
