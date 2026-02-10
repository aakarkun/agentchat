import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./primitives/Button.jsx";

export interface HeaderMenuItem {
  label: string;
  onSelect: () => void;
}

export interface HeaderMenuProps {
  items: HeaderMenuItem[];
  /** Accessible label for the trigger button. */
  triggerLabel?: string;
  /** Trigger button content (e.g. icon). Default: "⋮" */
  triggerContent?: React.ReactNode;
  /** Class for the wrapper (trigger container). */
  className?: string;
  /** Class applied to the trigger button. */
  triggerClassName?: string;
  /** Class applied to the dropdown panel. */
  menuClassName?: string;
  /** Class applied to each menu item button. */
  menuItemClassName?: string;
  /** Inline style for the wrapper. */
  style?: React.CSSProperties;
}

/**
 * Header dropdown menu. Renders the list in a portal so it is never clipped by overflow.
 * Accepts className, style, triggerClassName, menuClassName, menuItemClassName (shadcn-style).
 */
export function HeaderMenu({
  items,
  triggerLabel = "Menu",
  triggerContent = "⋮",
  className = "",
  style,
  triggerClassName = "",
  menuClassName = "",
  menuItemClassName = "",
}: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !open) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.right - 160,
    });
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuRect(null);
      return;
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const portalRoot = document.getElementById("agentchat-menu-portal");
      if (portalRoot?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = useCallback((item: HeaderMenuItem) => {
    item.onSelect();
    setOpen(false);
  }, []);

  const defaultTriggerClass =
    "h-8 w-8 shrink-0 rounded-md border border-border p-0";
  const defaultMenuClass =
    "min-w-[8rem] overflow-hidden rounded-md border border-border bg-background p-1 shadow-md";
  const defaultItemClass =
    "flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground";

  return (
    <>
      <div
        className={`relative ${className}`.trim()}
        style={style}
        ref={triggerRef}
      >
        <Button
          type="button"
          variant="default"
          className={`${defaultTriggerClass} ${triggerClassName}`.trim()}
          onClick={() => setOpen((o) => !o)}
          aria-label={triggerLabel}
          aria-expanded={open}
        >
          {triggerContent}
        </Button>
      </div>
      {open &&
        menuRect &&
        createPortal(
          <div
            id="agentchat-menu-portal"
            role="menu"
            className={`fixed z-[9999] ${defaultMenuClass} ${menuClassName}`.trim()}
            style={{
              top: menuRect.top,
              left: Math.max(8, menuRect.left),
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`${defaultItemClass} ${menuItemClassName}`.trim()}
                onClick={() => handleSelect(item)}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
