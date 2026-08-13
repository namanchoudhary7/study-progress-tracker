let lastSyncedAt: number | null = null;
const listeners = new Set<() => void>();

export function markSynced(timestamp: number) {
  if (lastSyncedAt === null || timestamp > lastSyncedAt) {
    lastSyncedAt = timestamp;
    listeners.forEach((l) => l());
  }
}

export function getLastSynced(): number | null {
  return lastSyncedAt;
}

export function subscribeLastSynced(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
