import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Clock, Download, LayoutDashboard, LogOut, Menu, Moon, RotateCcw, Sun, Target, Monitor } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useLastSynced } from "../hooks/useLastSynced";
import { downloadExport } from "../api/export";
import { IconButton } from "./ui/IconButton";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/sessions", label: "Sessions", icon: Clock },
  { to: "/review", label: "Review", icon: RotateCcw },
  { to: "/goals", label: "Goals", icon: Target },
];

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor };

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { preference, cyclePreference } = useTheme();
  const lastSynced = useLastSynced();
  const [exporting, setExporting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

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
        <span className="text-lg font-semibold">Study Tracker</span>
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
          <p className="truncate px-2 text-xs text-neutral-500" title={user.email}>
            {user.email}
          </p>
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
        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
