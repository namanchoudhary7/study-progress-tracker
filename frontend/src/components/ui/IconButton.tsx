import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "secondary" | "ghost" | "danger" | "active";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  secondary:
    "border border-neutral-300 text-neutral-700 hover:border-accent-500 hover:text-accent-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-accent-400 dark:hover:text-accent-300",
  ghost: "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60",
  danger:
    "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40",
  active: "bg-accent-600 text-white hover:bg-accent-500",
};

export function IconButton({ icon: Icon, label, variant = "secondary", className = "", ...props }: IconButtonProps) {
  return (
    <button
      title={label}
      aria-label={label}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
