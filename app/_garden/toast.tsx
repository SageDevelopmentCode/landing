"use client";

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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Garden toasts for the web. Mirrors the mobile `useToast()` API:
 * `show({ tone, title, message?, action?, duration? })` returns an id,
 * then `update(id, …)` / `dismiss(id)`.
 * Mount `GardenToastProvider` inside a `.sf-garden` scope (GardenRoot / GardenIsland).
 */

export type ToastTone = "success" | "info" | "error" | "loading";

export type ToastAction = { label: string; onClick: () => void };

export type ToastInput = {
  tone?: ToastTone;
  title: string;
  message?: string;
  action?: ToastAction;
  /** ms before auto-dismiss. Loading toasts stay until updated. */
  duration?: number;
};

type ToastItem = ToastInput & { id: number; tone: ToastTone; version: number };

type ToastApi = {
  show: (t: ToastInput) => number;
  update: (id: number, t: Partial<ToastInput>) => void;
  dismiss: (id: number) => void;
};

const noop: ToastApi = { show: () => -1, update: () => {}, dismiss: () => {} };

const ToastContext = createContext<ToastApi>(noop);

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 3200,
  info: 3800,
  error: 6500,
  loading: Number.POSITIVE_INFINITY,
};

const MAX_VISIBLE = 3;

export function GardenToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((t: ToastInput) => {
    const id = nextId.current++;
    setToasts((prev) =>
      [...prev, { ...t, tone: t.tone ?? "info", id, version: 0 }].slice(-MAX_VISIBLE),
    );
    return id;
  }, []);

  const update = useCallback((id: number, patch: Partial<ToastInput>) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...patch, tone: patch.tone ?? t.tone, version: t.version + 1 }
          : t,
      ),
    );
  }, []);

  const api = useMemo(() => ({ show, update, dismiss }), [show, update, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-center gap-2.5 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] sm:items-end"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const TONE_STYLE: Record<ToastTone, { badge: string; icon: ReactNode; ring: string }> = {
  success: {
    badge: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]",
    ring: "border-[var(--sf-sage)]/35",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
      </svg>
    ),
  },
  info: {
    badge: "bg-[var(--sf-sky)] text-[#2d5d86]",
    ring: "border-[#2d5d86]/20",
    icon: <span className="text-sm font-extrabold" aria-hidden="true">i</span>,
  },
  error: {
    badge: "bg-[var(--sf-coral)]/25 text-[var(--sf-coral-deep)]",
    ring: "border-[var(--sf-coral-deep)]/40",
    icon: <span className="text-sm font-extrabold" aria-hidden="true">!</span>,
  },
  loading: {
    badge: "bg-[var(--sf-butter)] text-[#7a5b00]",
    ring: "border-[#7a5b00]/20",
    icon: (
      <span
        className="block h-4 w-4 animate-spin rounded-full border-[2.5px] border-current border-t-transparent motion-reduce:animate-none"
        aria-hidden="true"
      />
    ),
  },
};

function ToastCard({ toast, onDismiss: dismissById }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const reduce = useReducedMotion();
  const toastId = toast.id;
  const onDismiss = useCallback(() => dismissById(toastId), [dismissById, toastId]);
  const [paused, setPaused] = useState(false);
  const duration = toast.duration ?? DEFAULT_DURATION[toast.tone];
  const style = TONE_STYLE[toast.tone];

  useEffect(() => {
    if (paused || !Number.isFinite(duration)) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
    // restart the timer whenever the toast is updated
  }, [paused, duration, onDismiss, toast.version]);

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-[22px] border-2 bg-white px-4 py-3 text-[var(--sf-ink)] shadow-[0_5px_0_0_rgba(43,42,38,0.1),0_24px_50px_-28px_rgba(43,42,38,0.55)] sm:w-[380px] ${style.ring}`}
    >
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.badge}`}>
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-extrabold leading-snug">{toast.title}</p>
        {toast.message ? (
          <p className="mt-0.5 text-sm leading-snug text-[var(--sf-soft)] break-words">{toast.message}</p>
        ) : null}
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="mt-2 inline-flex min-h-[32px] items-center rounded-full bg-[var(--sf-ink)] px-3.5 text-xs font-extrabold text-white transition hover:bg-[var(--sf-ink)]/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>
      {toast.tone !== "loading" ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--sf-soft)] transition hover:bg-[var(--sf-ink)]/5 hover:text-[var(--sf-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      ) : null}
    </motion.div>
  );
}
