import { useEffect, useState, useSyncExternalStore } from "react";
import { getLastSynced, subscribeLastSynced } from "../lib/lastSynced";

function formatAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function useLastSynced(): string | null {
  const timestamp = useSyncExternalStore(subscribeLastSynced, getLastSynced);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  if (timestamp === null) return null;
  return formatAgo(Date.now() - timestamp);
}
