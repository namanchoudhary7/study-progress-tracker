import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Bot,
  CalendarDays,
  Clock,
  Download,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  Target,
  Monitor,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useLastSynced } from "../hooks/useLastSynced";
import { downloadExport } from "../api/export";
import { BrandLogo } from "./BrandLogo";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agent", label: "Coach", icon: Bot },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/sessions", label: "Sessions", icon: Clock },
  { to: "/review", label: "Review", icon: RotateCcw },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/plans", label: "Plans", icon: CalendarDays },
  { to: "/settings", label: "Settings", icon: Settings },
];

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor };

export function Layout() {
  const { user, logout, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { preference, cyclePreference } = useTheme();
  const lastSynced = useLastSynced();
  const [exporting, setExporting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleResendVerification() {
    setResendState("sending");
    try {
      await resendVerification();
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  }

  const showVerifyBanner = user && !user.email_verified && !bannerDismissed;

  async function handleExport() {
    setExporting(true);
    try {
      await downloadExport();
    } finally {
      setExporting(false);
    }
  }

  const currentTitle = navItems.find((item) => item.to === location.pathname)?.label;
  const ThemeIcon = THEME_ICON[preference];

  const sidebarContent = (
    <>
      <div className="px-4 py-4">
        <BrandLogo />
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-neutral-200 px-2 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-1 px-1">
          <IconButton icon={ThemeIcon} label={`Theme: ${preference}`} onClick={cyclePreference} />
          <IconButton icon={Download} label="Export data" onClick={handleExport} disabled={exporting} />
          <IconButton icon={LogOut} label="Log out" onClick={handleLogout} />
        </div>
        {user && (
          <div className="truncate px-2" title={user.email}>
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.username}</p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <aside className="hidden w-56 flex-col border-r border-neutral-200 bg-white sm:flex dark:border-neutral-800 dark:bg-neutral-900">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-56 flex-col bg-white dark:bg-neutral-900">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {currentTitle && <h1 className="text-lg font-semibold">{currentTitle}</h1>}
          {lastSynced && <span className="ml-auto text-xs text-neutral-500">Updated {lastSynced}</span>}
        </header>
        {showVerifyBanner && (
          <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 sm:px-6">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              {resendState === "sent" ? "Verification email sent — check your inbox." : "Please verify your email address."}
            </span>
            {resendState !== "sent" && (
              <Button size="sm" variant="secondary" onClick={handleResendVerification} disabled={resendState === "sending"}>
                Resend email
              </Button>
            )}
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-xs text-amber-700 hover:underline dark:text-amber-400"
            >
              Dismiss
            </button>
          </div>
        )}
        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
