import React, { useRef, useEffect, useState } from "react";

export interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function Conversation({ className = "", children, ...props }: ConversationProps) {
  return (
    <div className={`flex flex-1 min-h-0 flex-col relative ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export interface ConversationContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

const SCROLL_BUTTON_SHOW_PX = 500;

/** Only show scroll-to-bottom when user has scrolled 500px or more above the bottom. */
export function ConversationContent({
  className = "",
  children,
  ...props
}: ConversationContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const updateScrollButton = () => {
      const { scrollHeight, scrollTop, clientHeight } = el;
      const canScroll = scrollHeight > clientHeight + 10;
      const contentBelow = scrollHeight - scrollTop - clientHeight;
      setShowScrollButton(canScroll && contentBelow > SCROLL_BUTTON_SHOW_PX);
    };
    el.addEventListener("scroll", updateScrollButton);
    updateScrollButton();
    // Scroll to bottom when content changes
    el.scrollTo({ top: el.scrollHeight });
    const raf = requestAnimationFrame(updateScrollButton);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", updateScrollButton);
    };
  }, [children]);

  return (
    <div
      ref={scrollRef}
      data-agentchat-content
      className={`agentchat-scroll-area flex flex-1 flex-col gap-3 overflow-auto bg-muted/40 p-4 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ConversationScrollButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  visible?: boolean;
  /** Content of the scroll-to-bottom button (default: arrow ↓). */
  label?: React.ReactNode;
}

export function ConversationScrollButton({
  className = "",
  visible = true,
  /** Content of the button (default: arrow ↓). */
  label = "↓",
  ...props
}: ConversationScrollButtonProps) {
  if (!visible) return null;
  const scrollToBottom = () => {
    const container = document.querySelector("[data-agentchat-content]");
    container?.scrollTo({ top: (container as HTMLDivElement).scrollHeight, behavior: "smooth" });
  };
  return (
    <button
      type="button"
      className={`absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-background px-3 py-1.5 text-sm shadow-lg hover:opacity-90 ${className}`.trim()}
      onClick={scrollToBottom}
      aria-label="Scroll to bottom"
      {...props}
    >
      {label}
    </button>
  );
}

export interface ConversationEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ConversationEmptyState({
  title = "Start a conversation",
  description = "Type a message below to begin.",
  icon,
  className = "",
}: ConversationEmptyStateProps) {
  return (
    <div className={`text-center py-12 px-8 text-muted-foreground ${className}`.trim()}>
      {icon && <div className="mb-3">{icon}</div>}
      <p className="font-semibold text-base text-foreground">{title}</p>
      <p className="text-sm mt-1">{description}</p>
    </div>
  );
}

/** Skeleton placeholders while messages are loading. */
export function ConversationSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()} aria-busy aria-label="Loading messages">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`flex gap-2 ${i % 2 === 0 ? "self-end flex-row-reverse" : "self-start flex-row"}`}
        >
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
          <div
            className={`h-14 animate-pulse rounded-2xl bg-muted ${
              i % 2 === 0 ? "w-48" : "w-56"
            }`.trim()}
          />
        </div>
      ))}
    </div>
  );
}
