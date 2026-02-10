import React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

const sizeMap = { sm: 32, md: 40, lg: 48 };

export function Avatar({
  src,
  alt = "",
  size = "md",
  className = "",
  children,
  style,
  ...props
}: AvatarProps) {
  const px = sizeMap[size];
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full bg-muted ${className}`.trim()}
      style={{ width: px, height: px, ...style }}
      {...props}
    >
      {src != null ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : children}
    </div>
  );
}
