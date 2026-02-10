import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Textarea } from "../primitives/index.js";
import type { ChatStatus } from "../types.js";

/** When "llm", footer shows Auto label and usage slot. When "agentchat", only attachment (if enabled) and send. */
export type PromptInputMode = "agentchat" | "llm";

export interface PromptInputProps {
  onSubmit: (text: string) => void;
  status?: ChatStatus;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** When "llm", shows Auto label and usage in footer. Default "agentchat" when not set. */
  inputMode?: PromptInputMode;
  /** Show attachment (+) button. Only shown when true. */
  showAttachment?: boolean;
  /** Called when attachment button is clicked. Only relevant if showAttachment is true. */
  onAttachmentClick?: () => void;
  /** Label for LLM "auto" mode (e.g. "Auto"). Only shown when inputMode === "llm". */
  autoLabel?: string;
  /** Usage text (e.g. "52% used"). Only shown when inputMode === "llm" and this is set. */
  usageLabel?: string;
  /** Custom footer content below the input bar. */
  footer?: React.ReactNode;
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function PromptInput({
  onSubmit,
  status = "ready",
  placeholder = "Ask, Search or Chat…",
  disabled = false,
  className = "",
  inputMode = "agentchat",
  showAttachment = false,
  onAttachmentClick,
  autoLabel = "Auto",
  usageLabel,
  footer,
}: PromptInputProps) {
  const [value, setValue] = useState("");
  const isDisabled = disabled || status !== "ready";
  const isLLM = inputMode === "llm";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || isDisabled) return;
    onSubmit(text);
    setValue("");
  };

  return (
    <form
      className={`shrink-0 border-t border-border bg-background px-4 py-3 ${className}`.trim()}
      onSubmit={handleSubmit}
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-muted/30 px-3 py-2 shadow-sm">
        <PromptInputTextarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={isDisabled}
          className="max-h-48 border-0 bg-transparent py-1.5 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {showAttachment && (
              <button
                type="button"
                onClick={onAttachmentClick}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Attach or add"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            )}
            {isLLM && <span className="font-medium">{autoLabel}</span>}
            {isLLM && usageLabel != null && usageLabel !== "" && (
              <span>{usageLabel}</span>
            )}
          </div>
          <PromptInputSubmit
            disabled={isDisabled || !value.trim()}
            status={status}
            className="h-9 w-9 shrink-0 rounded-full p-0"
          />
        </div>
      </div>
      {footer != null && footer !== false && (
        <div className="mt-2">{footer}</div>
      )}
    </form>
  );
}

export interface PromptInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(function PromptInputTextarea({ className = "", onChange, ...props }, ref) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  const setRefs = useCallback(
    (el: HTMLTextAreaElement | null) => {
      internalRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref && "current" in ref) ref.current = el;
    },
    [ref]
  );

  const adjustHeight = useCallback(() => {
    const el = internalRef.current;
    if (!el) return;
    el.style.height = "auto";
    const minH = 32;
    const maxH = 192;
    el.style.height = `${Math.max(minH, Math.min(el.scrollHeight, maxH))}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [props.value, adjustHeight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      onChange?.(e);
    },
    [onChange, adjustHeight]
  );

  return (
    <Textarea
      ref={setRefs}
      style={{ minHeight: "2rem" }}
      className={`w-full resize-none overflow-hidden rounded-lg border-0 bg-transparent py-1.5 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:ring-0 ${className}`.trim()}
      rows={1}
      onChange={handleChange}
      {...props}
    />
  );
});

export interface PromptInputSubmitProps {
  disabled?: boolean;
  status?: ChatStatus;
  className?: string;
}

export function PromptInputSubmit({
  disabled,
  status = "ready",
  className = "",
}: PromptInputSubmitProps) {
  const label =
    status === "streaming" || status === "submitted" ? "…" : null;
  return (
    <Button
      type="submit"
      variant="primary"
      disabled={disabled}
      className={className}
      aria-label={label ?? "Send"}
    >
      {label != null ? (
        <span className="text-sm">{label}</span>
      ) : (
        <SendIcon className="h-5 w-5" />
      )}
    </Button>
  );
}

export interface PromptInputFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export function PromptInputFooter({ className = "", children }: PromptInputFooterProps) {
  return <div className={`mt-2 ${className}`.trim()}>{children}</div>;
}
