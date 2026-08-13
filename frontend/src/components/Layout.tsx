import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { useLastSynced } from "../hooks/useLastSynced";
import { downloadExport } from "../api/export";

const THEME_ICON = { light: "☀️", dark: "🌙", system: "🖥️" };

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/subjects", label: "Subjects" },
  { to: "/sessions", label: "Sessions" },
  { to: "/review", label: "Review" },
  { to: "/goals", label: "Goals" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { preference, cyclePreference } = useTheme();
  const lastSynced = useLastSynced();
  const [exporting, setExporting] = useState(false);

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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <span className="font-semibold">Study Progress Tracker</span>
            <nav className="flex gap-4 overflow-x-auto text-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive
                      ? "font-medium text-blue-600 dark:text-blue-400"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            {lastSynced && <span className="hidden sm:inline">Updated {lastSynced}</span>}
            {user && <span>Signed in as {user.email}</span>}
            <button
              onClick={handleExport}
              disabled={exporting}
              title="Export all your data as JSON"
              className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {exporting ? "Exporting…" : "Export data"}
            </button>
            <button
              onClick={cyclePreference}
              title={`Theme: ${preference}`}
              className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {THEME_ICON[preference]}
            </button>
            <button onClick={handleLogout} className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
