"use client";

import { CircleCheck, CircleX, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
};

type ToastContextValue = {
  /** Low-level API. Returns the new toast id. */
  show: (
    variant: ToastVariant,
    title: string,
    description?: string,
    duration?: number,
  ) => number;
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;
// Errors stay longer so the user has time to read what went wrong.
const ERROR_DURATION = 6000;
// Keep the stack readable; older toasts drop off when a new one arrives.
const MAX_VISIBLE = 4;

const VARIANT_STYLES: Record<
  ToastVariant,
  { color: string; soft: string; Icon: typeof CircleCheck }
> = {
  success: { color: "#16A34A", soft: "#F0FDF4", Icon: CircleCheck },
  error: { color: "#DC2626", soft: "#FEF2F2", Icon: CircleX },
  info: { color: "#0284C7", soft: "#F0F9FF", Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (
      variant: ToastVariant,
      title: string,
      description?: string,
      duration?: number,
    ) => {
      const id = (idRef.current += 1);
      const toast: Toast = {
        id,
        variant,
        title,
        description,
        duration:
          duration ?? (variant === "error" ? ERROR_DURATION : DEFAULT_DURATION),
      };
      setToasts((current) => [...current, toast].slice(-MAX_VISIBLE));
      return id;
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, description) => show("success", title, description),
      error: (title, description) => show("error", title, description),
      info: (title, description) => show("info", title, description),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    // A static region wrapper: each toast carries its own live semantics
    // (role="alert" = assertive for errors, role="status" = polite otherwise),
    // which is what actually announces dynamically-inserted toasts. z-40 keeps
    // toasts above page chrome (topbar z-30, sticky footer z-10) but below the
    // mobile nav drawer and account dropdown (z-50), which should occlude them.
    <div
      role="region"
      aria-label="Notifikasi"
      className="pointer-events-none fixed inset-x-4 top-[70px] z-40 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const { color, soft, Icon } = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      className="toast-enter pointer-events-auto flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-lg"
      style={{ borderLeft: `4px solid ${color}`, backgroundColor: soft }}
    >
      <Icon className="mt-0.5 size-5 shrink-0" style={{ color }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#0F172A]">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs leading-5 text-[#475569]">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Tutup notifikasi"
        className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-[#94A3B8] transition hover:bg-black/5 hover:text-[#0F172A]"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
