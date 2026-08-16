import { Link } from "react-router-dom";
import { Terminal } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function BrandLogo({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  return (
    <Link
      to={isAuthenticated ? "/dashboard" : "/"}
      className={className ?? "flex items-center gap-2 text-neutral-900 dark:text-neutral-100"}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-accent-500/50 bg-accent-500/10 text-accent-600 dark:text-accent-400">
        <Terminal className="h-4 w-4" />
      </span>
      <span className="font-mono text-sm font-semibold tracking-tight">
        study<span className="text-accent-600 dark:text-accent-400">.</span>tracker
      </span>
    </Link>
  );
}
