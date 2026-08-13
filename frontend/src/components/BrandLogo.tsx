import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function BrandLogo({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  return (
    <Link
      to={isAuthenticated ? "/dashboard" : "/"}
      className={className ?? "flex items-center gap-2 text-neutral-900 dark:text-neutral-100"}
    >
      <GraduationCap className="h-6 w-6" />
      <span className="text-lg font-semibold">Study Tracker</span>
    </Link>
  );
}
