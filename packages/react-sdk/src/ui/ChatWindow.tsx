import React from "react";

export interface ChatWindowProps {
  className?: string;
  style?: React.CSSProperties;
  theme?: "light" | "dark" | "auto";
  /** Main header content (e.g. avatar + conversation name). */
  header?: React.ReactNode;
  /**
   * Optional header actions: pass your own menu, buttons, or icons.
   * Rendered on the right side of the header. Fully controlled by the app.
   */
  headerActions?: React.ReactNode;
  /** Class for the header bar. */
  headerClassName?: string;
  /** Class for the sidebar container. */
  sidebarClassName?: string;
  /** Class for the main content area. */
  contentClassName?: string;
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Layout wrapper for chat: optional header, optional sidebar, theme.
 * Wrap AgentChatUI or custom composition inside.
 */
const defaultHeaderClass =
  "relative z-20 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-5 py-3.5";
const defaultSidebarClass = "shrink-0 overflow-auto border-r border-border bg-background";
const defaultContentClass = "flex min-h-0 flex-1 flex-col overflow-hidden bg-background";

export function ChatWindow({
  className = "",
  style,
  theme = "auto",
  header,
  headerActions,
  headerClassName = "",
  sidebarClassName = "",
  contentClassName = "",
  sidebar,
  children,
}: ChatWindowProps) {
  return (
    <div
      className={`agentchat-window ${className}`.trim()}
      style={style}
      data-theme={theme}
    >
      {(header || sidebar) && (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {sidebar && (
            <aside className={`${defaultSidebarClass} ${sidebarClassName}`.trim()}>
              {sidebar}
            </aside>
          )}
          <div className={`${defaultContentClass} ${contentClassName}`.trim()}>
            {(header || headerActions) && (
              <header className={`${defaultHeaderClass} ${headerClassName}`.trim()}>
                <div className="min-w-0 flex-1">{header}</div>
                {headerActions != null && (
                  <div className="relative z-20 flex shrink-0 items-center gap-1">
                    {headerActions}
                  </div>
                )}
              </header>
            )}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          </div>
        </div>
      )}
      {!header && !sidebar && children}
    </div>
  );
}
