"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/app/_garden/motion";

/**
 * Sheets render into a container at the end of the Garden scope, so a transformed
 * ancestor (GSAP reveals, hover lifts) can never trap their `position: fixed`.
 */
const PortalContext = createContext<HTMLElement | null>(null);
export const SheetPortalProvider = PortalContext.Provider;

function InPortal({ children }: { children: ReactNode }) {
  const container = useContext(PortalContext);
  return container ? createPortal(children, container) : <>{children}</>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Moves focus into `ref` when it mounts, restores it to the trigger when it unmounts,
 * locks page scroll, and returns a keydown handler that closes on Esc and traps Tab.
 */
function useDialogBehaviour(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const el = ref.current;
    // Prefer an explicit autofocus target, then the panel itself.
    const target = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el;
    target?.focus({ preventScroll: true });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [ref]);

  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !ref.current) return;
    e.stopPropagation();
    const nodes = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (n) => n.offsetParent !== null || n === document.activeElement,
    );
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--sf-ink)] shadow-[0_3px_0_0_rgba(43,42,38,0.12)] ring-1 ring-[var(--sf-ink)]/10 transition hover:-translate-y-0.5 hover:bg-[var(--sf-butter)] focus-visible:-translate-y-0.5 focus-visible:bg-[var(--sf-butter)] focus-visible:outline-none active:translate-y-0.5 cursor-pointer"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
        <path d="M5 5l10 10M15 5L5 15" />
      </svg>
    </button>
  );
}

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Small emoji or icon shown in a pastel bubble beside the title. */
  icon?: ReactNode;
  /** Handwritten note under the title, e.g. "step 2 of 3". */
  note?: ReactNode;
  /** Optional row under the header (child tabs, filters). */
  toolbar?: ReactNode;
  /** Sticky bottom area for the primary action. */
  footer?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
};

/** Right drawer on ≥sm, bottom sheet on phones. Accessible modal dialog. */
export default function GardenSheet(props: SheetProps) {
  return (
    <InPortal>
      <AnimatePresence>{props.open ? <SheetPanel {...props} /> : null}</AnimatePresence>
    </InPortal>
  );
}

function SheetPanel({ onClose, title, icon, note, toolbar, footer, onBack, backLabel = "Back", children }: SheetProps) {
  const reduce = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 640px)");
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onKeyDown = useDialogBehaviour(panelRef, onClose);

  const hidden = reduce ? { opacity: 0 } : desktop ? { x: "100%" } : { y: "100%" };
  const shown = reduce ? { opacity: 1 } : desktop ? { x: 0 } : { y: 0 };

  return (
    <>
      <motion.div
        className="pointer-events-auto fixed inset-0 z-50 bg-[var(--sf-ink)]/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        initial={hidden}
        animate={shown}
        exit={hidden}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-[60] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[32px] bg-[var(--sf-cream)] text-[var(--sf-ink)] shadow-[0_-20px_60px_-30px_rgba(43,42,38,0.6)] outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[480px] sm:rounded-none sm:rounded-l-[36px]"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-[var(--sf-ink)]/15 sm:hidden" aria-hidden="true" />
        <div className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-3 sm:px-6 sm:pt-6">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_3px_0_0_rgba(43,42,38,0.12)] ring-1 ring-[var(--sf-ink)]/10 transition hover:bg-[var(--sf-mint)] focus-visible:bg-[var(--sf-mint)] focus-visible:outline-none cursor-pointer"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12.5 4.5L7 10l5.5 5.5" />
              </svg>
            </button>
          ) : icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--sf-butter)] text-xl" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id={titleId} className="sf-display text-2xl leading-tight sm:text-[1.7rem]">
              {title}
            </h2>
            {note ? <p className="sf-hand mt-0.5 text-lg leading-tight text-[var(--sf-sage-deep)]">{note}</p> : null}
          </div>
          <CloseButton onClick={onClose} />
        </div>
        {toolbar ? <div className="shrink-0 px-5 pb-3 sm:px-6">{toolbar}</div> : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-1 sm:px-6" data-lenis-prevent>
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t-2 border-dashed border-[var(--sf-ink)]/10 bg-white/70 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:px-6">
            {footer}
          </div>
        ) : null}
      </motion.div>
    </>
  );
}

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Visual header above the content (e.g. a photo). */
  media?: ReactNode;
  children: ReactNode;
  /** z-index layer; nested dialogs above a sheet use "top". */
  layer?: "base" | "top";
  /** Bottom sheet on phones (default) or always centred. */
  phoneSheet?: boolean;
};

/** Centred modal on ≥sm; bottom sheet on phones. */
export function GardenDialog(props: DialogProps) {
  return (
    <InPortal>
      <AnimatePresence>{props.open ? <DialogPanel {...props} /> : null}</AnimatePresence>
    </InPortal>
  );
}

function DialogPanel({ onClose, title, media, children, layer = "base", phoneSheet = true }: DialogProps) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onKeyDown = useDialogBehaviour(panelRef, onClose);
  const z = layer === "top" ? "z-[75]" : "z-50";

  return (
    <motion.div
      className={`pointer-events-auto fixed inset-0 ${z} flex ${phoneSheet ? "items-end" : "items-center"} justify-center bg-[var(--sf-ink)]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-[var(--sf-cream)] text-[var(--sf-ink)] shadow-[0_30px_60px_-30px_rgba(43,42,38,0.6)] outline-none sm:max-w-lg sm:rounded-[32px] ${phoneSheet ? "rounded-t-[32px]" : "mx-4 rounded-[28px]"}`}
      >
        {media}
        <div className="absolute right-4 top-4 z-10">
          <CloseButton onClick={onClose} />
        </div>
        <div className="overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6" data-lenis-prevent>
          <h2 id={titleId} className="sf-display pr-12 text-2xl leading-tight sm:text-3xl">
            {title}
          </h2>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
