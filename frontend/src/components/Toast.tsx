import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface UndoToastOptions {
  message: string;
  onUndo: () => void;
  onExpire: () => void;
  duration?: number;
}

interface ToastItem {
  id: number;
  message: string;
}

interface ToastContextValue {
  showUndoToast: (options: UndoToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const callbacks = useRef(new Map<number, { onUndo: () => void; onExpire: () => void }>());

  const showUndoToast = useCallback(({ message, onUndo, onExpire, duration = 5000 }: UndoToastOptions) => {
    const id = nextToastId++;
    callbacks.current.set(id, { onUndo, onExpire });
    const timer = setTimeout(() => {
      timers.current.delete(id);
      const cb = callbacks.current.get(id);
      callbacks.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
      cb?.onExpire();
    }, duration);
    timers.current.set(id, timer);
    setToasts((prev) => [...prev, { id, message }]);
  }, []);

  function handleUndo(id: number) {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    const cb = callbacks.current.get(id);
    callbacks.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
    cb?.onUndo();
  }

  return (
    <ToastContext.Provider value={{ showUndoToast }}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          >
            <span>{t.message}</span>
            <button
              onClick={() => handleUndo(t.id)}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Undo
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
