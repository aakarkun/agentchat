import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary";
  className?: string;
  children?: React.ReactNode;
}

export function Button({
  variant = "default",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-opacity disabled:pointer-events-none disabled:opacity-50 " +
    (variant === "primary"
      ? "bg-primary text-primary-foreground border-transparent hover:opacity-90"
      : "bg-background text-foreground border border-border hover:opacity-90");
  return (
    <button
      type="button"
      className={`${base} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
