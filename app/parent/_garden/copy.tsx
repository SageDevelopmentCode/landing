"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { useToast } from "@/app/_garden/toast";
import { CheckIcon } from "./ui";

type CopyOptions = {
  /** Success toast title. Defaults to "Copied". */
  title?: string;
  /** Optional success toast message (e.g. "Paste it when the page asks."). */
  message?: string;
  /** "info" when copying is a side effect of another action (opening a newsletter). */
  tone?: "success" | "info";
  /** Element whose text gets selected when the clipboard is blocked, so the parent can copy by hand. */
  selectEl?: HTMLElement | null;
  /** Message on the failure toast. Defaults to showing the text itself. */
  failMessage?: string;
  /** Skip the success toast (the button's ✓ is enough feedback). */
  silent?: boolean;
};

function selectText(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/**
 * Copy-to-clipboard with Garden feedback: `copiedKey` flips for 2s (show ✓ in the button)
 * and a toast confirms. When the clipboard is blocked, the text is selected and an
 * error toast tells the parent to copy it by hand.
 */
export function useCopy() {
  const toast = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (key: string, text: string, opts: CopyOptions = {}) => {
      try {
        if (!navigator.clipboard) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopiedKey(null), 2000);
        if (!opts.silent) toast.show({ tone: opts.tone ?? "success", title: opts.title ?? "Copied", message: opts.message });
        return true;
      } catch {
        if (opts.selectEl) selectText(opts.selectEl);
        toast.show({
          tone: "error",
          title: "Couldn't copy automatically",
          message: opts.failMessage ?? (opts.selectEl ? "It's selected for you. Copy it by hand." : text),
        });
        return false;
      }
    },
    [toast],
  );

  return { copy, copiedKey };
}

/**
 * Small "Copy" pill that turns into "✓ Copied". Pass `label` for screen readers
 * ("Copy Guardian 1 cell phone"). `compact` renders a 44px icon-only button.
 */
export function CopyButton({
  text,
  label,
  toastTitle = "Copied",
  selectEl,
  compact,
  className = "",
}: {
  text: string;
  label: string;
  toastTitle?: string;
  selectEl?: HTMLElement | null;
  compact?: boolean;
  className?: string;
}) {
  const { copy, copiedKey } = useCopy();
  const copied = copiedKey === "btn";
  const base =
    "inline-flex shrink-0 items-center justify-center gap-1 rounded-full text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer";
  const tone = copied
    ? "bg-[var(--sf-sage)] text-white"
    : "bg-white text-[var(--sf-sage-deep)] ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:bg-[var(--sf-mint)] active:translate-y-0";
  return (
    <button
      type="button"
      onClick={() => void copy("btn", text, { title: toastTitle, selectEl })}
      aria-label={copied ? `${label}: copied` : label}
      className={`${base} ${tone} ${compact ? "h-11 w-11" : "min-h-9 min-w-[78px] px-3"} ${className}`}
    >
      {copied ? <CheckIcon className="h-3 w-3" /> : <Copy className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
      {compact ? null : copied ? "Copied" : "Copy"}
    </button>
  );
}
