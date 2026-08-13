export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      <span>Something went wrong: {message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-3 shrink-0 rounded border border-red-300 px-2 py-1 text-xs hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40">
          Retry
        </button>
      )}
    </div>
  );
}
