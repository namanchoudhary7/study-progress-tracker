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
    <span
      style={style}
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wider ${className}`}
    >
      {children}
    </span>
  );
}
