import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error";

interface ToastData {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION = 3000;

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string) => {
    if (!message) {
      return;
    }
    idCounter += 1;
    const id = idCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => remove(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    if (exiting) {
      return;
    }
    setExiting(true);
    window.setTimeout(onDismiss, 220);
  }, [exiting, onDismiss]);

  useEffect(() => {
    if (paused || exiting) {
      return;
    }
    const timer = window.setTimeout(dismiss, TOAST_DURATION);
    return () => window.clearTimeout(timer);
  }, [paused, exiting, dismiss]);

  return (
    <div
      className={`toast toast--${toast.type}${exiting ? " toast--exiting" : ""}`}
      role={toast.type === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="toast-icon" aria-hidden="true">
        {toast.type === "error" ? "!" : "\u2713"}
      </span>
      <p className="toast-message">{toast.message}</p>
      <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={dismiss}>
        {"\u00d7"}
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
