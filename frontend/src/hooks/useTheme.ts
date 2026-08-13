import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

function applyTheme(pref: ThemePreference) {
  const isDark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? "system"
  );

  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [preference]);

  const cyclePreference = useCallback(() => {
    setPreference((prev) => {
      const next: ThemePreference = prev === "light" ? "dark" : prev === "dark" ? "system" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { preference, cyclePreference };
}
