import { useCallback, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

let preference: ThemePreference = (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? "system";
const listeners = new Set<() => void>();

function applyTheme() {
  const isDark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

applyTheme();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (preference === "system") applyTheme();
});

function setPreference(next: ThemePreference) {
  preference = next;
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => preference);

  const cyclePreference = useCallback(() => {
    const next: ThemePreference = preference === "light" ? "dark" : preference === "dark" ? "system" : "light";
    setPreference(next);
  }, []);

  return { preference: current, cyclePreference };
}
