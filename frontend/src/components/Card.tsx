import type { CSSProperties, ReactNode } from "react";

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`relative rounded-md border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-md before:bg-gradient-to-r before:from-transparent before:via-accent-500/60 before:to-transparent dark:border-neutral-800 dark:bg-neutral-900/70 ${className}`}
    >
      {children}
    </div>
  );
}
