import type { CSSProperties, ReactNode } from "react";

export function Badge({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`} style={style}>
      {children}
    </span>
  );
}
