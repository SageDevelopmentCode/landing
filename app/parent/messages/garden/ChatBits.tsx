"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { KidAvatar, Spinner } from "@/app/parent/_garden/ui";
import { Skeleton } from "@/app/parent/_garden/states";
import type { ConversationParticipant } from "../actions";
import { FILE_ACCEPT, IMAGE_ACCEPT, roleLabel } from "./chat";
import { GroupIcon } from "./InboxBits";

/* ─── Icons (decorative, aria-hidden) ─────────────────────────────────────── */
function Svg({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
export const BackIcon = () => <Svg><path d="M15 5l-7 7 7 7" /></Svg>;
export const PhotoIcon = () => (
  <Svg>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M20 16l-4.5-4.5L7 19.5" />
  </Svg>
);
export const ClipIcon = () => <Svg><path d="M20 11.5l-7.8 7.8a5 5 0 01-7.1-7.1l8.2-8.2a3.3 3.3 0 014.7 4.7l-8.2 8.2a1.7 1.7 0 01-2.4-2.4l7.5-7.5" /></Svg>;
export const SendIcon = () => <Svg><path d="M12 19V5M6 11l6-6 6 6" /></Svg>;
export const CloseIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <Svg className={className}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const DocIcon = ({ className = "h-[18px] w-[18px]" }: { className?: string }) => (
  <Svg className={className}>
    <path d="M14 3.5H7a2 2 0 00-2 2v13a2 2 0 002 2h10a2 2 0 002-2V8.5z" />
    <path d="M14 3.5v5h5M9 13h6M9 16.5h4" />
  </Svg>
);
export const DownloadIcon = () => <Svg className="h-[15px] w-[15px]"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></Svg>;
export const ComposeIcon = () => (
  <Svg className="h-[18px] w-[18px]">
    <path d="M12 4H6.5A2.5 2.5 0 004 6.5v11A2.5 2.5 0 006.5 20h11a2.5 2.5 0 002.5-2.5V12" />
    <path d="M17.5 3.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z" />
  </Svg>
);
export const SearchIcon = () => <Svg className="h-[18px] w-[18px]"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></Svg>;

/* ─── Message body with links ─────────────────────────────────────────────── */
const URL_SPLIT = /(https?:\/\/[^\s]+)/g;
const IS_URL = /^https?:\/\/[^\s]+$/;

export function MessageBody({ body, mine }: { body: string; mine: boolean }) {
  return (
    <p className="whitespace-pre-wrap break-words">
      {body.split(URL_SPLIT).map((part, i) =>
        IS_URL.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`break-all font-bold underline underline-offset-2 ${mine ? "text-white" : "text-[var(--sf-sage-deep)]"}`}
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}

/* ─── Images (HEIC converted on the fly for browsers that can't show it) ─── */
export function HeicImage({ src, className = "" }: { src: string; className?: string }) {
  const isHeic = /\.(heic|heif)(\?|$)/i.test(src);
  const [converted, setConverted] = useState<{ src: string; url: string | null; failed: boolean } | null>(null);

  useEffect(() => {
    if (!isHeic) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const heic2any = (await import("heic2any")).default;
        const out = await heic2any({ blob, toType: "image/jpeg", quality: 0.85 });
        objectUrl = URL.createObjectURL(Array.isArray(out) ? out[0] : out);
        if (cancelled) URL.revokeObjectURL(objectUrl);
        else setConverted({ src, url: objectUrl, failed: false });
      } catch {
        if (!cancelled) setConverted({ src, url: null, failed: true });
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, isHeic]);

  const current = converted?.src === src ? converted : null;
  if (current?.failed) return <span className="text-xs font-semibold opacity-80">Image could not be displayed</span>;
  const displaySrc = isHeic ? current?.url : src;
  if (!displaySrc) return <Skeleton className="h-40 w-56 max-w-full rounded-2xl" />;
  // eslint-disable-next-line @next/next/no-img-element -- storage URLs / object URLs, sizes vary
  return <img src={displaySrc} alt="Photo attachment" className={className} />;
}

/* ─── Day separator ───────────────────────────────────────────────────────── */
export function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-3" role="separator" aria-label={label}>
      <span className="rounded-full bg-[#f3eadc] px-3 py-1 text-[11.5px] font-extrabold tracking-[0.02em] text-[var(--sf-soft)]">{label}</span>
    </div>
  );
}

/* ─── Bubble ──────────────────────────────────────────────────────────────── */
export function Bubble({
  mine,
  body,
  imageUrl,
  fileUrl,
  fileName,
  sending,
  failed,
  groupStart,
  groupEnd,
  srPrefix,
}: {
  mine: boolean;
  body: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  sending?: boolean;
  failed?: boolean;
  groupStart: boolean;
  groupEnd: boolean;
  /** Read before the content by screen readers, e.g. "You:" or "Ms. Rivera:". */
  srPrefix: string;
}) {
  const onlyImage = !!imageUrl && !body && !fileName;
  const light = mine || !!failed;
  const corner = mine
    ? `${groupStart ? "rounded-tr-[20px]" : "rounded-tr-lg"} ${groupEnd ? "rounded-br-[20px]" : "rounded-br-lg"}`
    : `${groupStart ? "rounded-tl-[20px]" : "rounded-tl-lg"} ${groupEnd ? "rounded-bl-[20px]" : "rounded-bl-lg"}`;
  const tone = failed
    ? "bg-[#b9554a] text-white"
    : mine
      ? "bg-[var(--sf-sage-deep)] text-white"
      : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/[0.08]";
  const local = sending || failed;
  const img = imageUrl ? <HeicImage src={imageUrl} className="max-h-60 w-full max-w-[260px] rounded-2xl object-cover" /> : null;
  const chip = `my-0.5 flex min-h-10 max-w-[240px] items-center gap-2 rounded-xl px-2.5 py-2 ${light ? "bg-white/15" : "bg-[#f6f0e6]"}`;

  return (
    <div
      className={`max-w-[82%] rounded-[20px] ${corner} ${tone} ${onlyImage ? "p-1" : "px-3.5 py-2"} text-[15px] leading-[1.45] ${
        sending ? "opacity-60" : ""
      } ${mine ? "self-end" : "self-start"}`}
    >
      <span className="sr-only">{srPrefix} </span>
      {img ? (
        local ? (
          img
        ) : (
          <a
            href={imageUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
          >
            {img}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )
      ) : null}
      {fileName ? (
        fileUrl && !local ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${chip} transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] ${
              light ? "hover:bg-white/25" : "hover:bg-[#efe6d7]"
            }`}
          >
            <DocIcon />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{fileName}</span>
            <span className="sr-only"> (opens the file)</span>
            <span className={light ? "text-white/80" : "text-[var(--sf-soft)]"}>
              <DownloadIcon />
            </span>
          </a>
        ) : (
          <span className={chip}>
            <DocIcon />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{fileName}</span>
          </span>
        )
      ) : null}
      {body ? (
        <div className={imageUrl || fileName ? "mt-1.5 px-0.5" : ""}>
          <MessageBody body={body} mine={light} />
        </div>
      ) : null}
    </div>
  );
}

/** Status line under a bubble group: time, "Sending…", or the failed retry button. */
export function MessageMeta({ mine, text, failed, onRetry }: { mine: boolean; text?: string; failed?: boolean; onRetry?: () => void }) {
  if (failed) {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex min-h-8 items-center gap-1 self-end rounded-full px-2 text-[12px] font-extrabold text-[#b9554a] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 cursor-pointer"
      >
        <span aria-hidden="true">⚠</span> Didn&apos;t send · Tap to retry
      </button>
    );
  }
  return (
    <span className={`mt-1 px-1.5 text-[11.5px] font-semibold text-[var(--sf-soft)]/80 ${mine ? "self-end" : "self-start"}`} aria-hidden={text === "Sending…" ? undefined : "true"}>
      {text}
    </span>
  );
}

export function ThreadSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 p-5" role="status" aria-live="polite">
      <span className="sr-only">Loading messages…</span>
      <Skeleton className="h-11 w-[55%] rounded-[20px]" />
      <Skeleton className="h-11 w-[40%] self-end rounded-[20px]" />
      <Skeleton className="h-16 w-[65%] rounded-[20px]" />
      <Skeleton className="h-11 w-[35%] self-end rounded-[20px]" />
    </div>
  );
}

/* ─── Thread header + members popover ─────────────────────────────────────── */
export const iconBtn =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--sf-ink)] transition hover:bg-[var(--sf-ink)]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";

export function ThreadHeader({
  title,
  subtitle,
  avatar,
  onBack,
  members,
  right,
}: {
  title: string;
  subtitle?: string | null;
  avatar: ReactNode;
  onBack: () => void;
  /** Group chats: participants for the members popover (null while loading). */
  members?: { list: ConversationParticipant[] | null; count: number } | null;
  right?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex min-h-[68px] items-center gap-2 border-b border-[var(--sf-ink)]/[0.08] bg-[var(--sf-cream)]/95 px-3 py-2 backdrop-blur sm:px-4">
      <button type="button" onClick={onBack} className={`${iconBtn} md:hidden`} aria-label="Back to inbox">
        <BackIcon />
      </button>
      {avatar}
      <div className="relative min-w-0 flex-1">
        <h2 className="truncate text-[16.5px] font-extrabold leading-tight">{title}</h2>
        {members ? (
          <MembersPopover members={members.list} count={members.count} />
        ) : subtitle ? (
          <p className="text-xs font-semibold text-[var(--sf-soft)]/80">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function MembersPopover({ members, count }: { members: ConversationParticipant[] | null; count: number }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
      btnRef.current?.focus();
    }
  }

  const label = count > 0 ? `${count} members` : "Group";
  return (
    <div onKeyDown={onKeyDown}>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="-ml-1 inline-flex min-h-7 items-center gap-1 rounded-full px-1 text-xs font-extrabold text-[var(--sf-sage-deep)] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-mint)] cursor-pointer"
      >
        {label}
        <svg viewBox="0 0 20 20" className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-label="Members"
          className="absolute left-0 top-full z-30 mt-2 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-[22px] bg-white shadow-[0_20px_50px_-20px_rgba(43,42,38,0.45)] ring-1 ring-[var(--sf-ink)]/[0.08]"
        >
          <p className="px-4 pb-1 pt-3 text-sm font-extrabold">Members</p>
          {members === null ? (
            <div className="flex flex-col gap-2 px-4 pb-4 pt-1">
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-4/5 rounded-xl" />
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto pb-2">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2">
                  <KidAvatar id={m.id} name={m.full_name} imageUrl={m.profile_image_url} size="h-9 w-9 text-xs" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{m.full_name}</span>
                    {roleLabel(m.role) ? <span className="block text-[11px] font-semibold text-[var(--sf-soft)]/80">{roleLabel(m.role)}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function HeaderAvatar({ id, name, imageUrl, group }: { id: string; name: string; imageUrl: string | null; group: boolean }) {
  if (group) return <GroupIcon size="h-10 w-10" />;
  return <KidAvatar id={id} name={name} imageUrl={imageUrl} size="h-10 w-10 text-xs" />;
}

/* ─── Composer ────────────────────────────────────────────────────────────── */
export function Composer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  busy,
  canSend,
  onPickImage,
  onPickFile,
  imagePreview,
  fileName,
  onClearImage,
  onClearFile,
  textareaRef,
  status,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder: string;
  /** No recipient yet (compose). */
  disabled?: boolean;
  busy?: boolean;
  canSend: boolean;
  onPickImage: (file: File) => void;
  onPickFile: (file: File) => void;
  imagePreview: string | null;
  fileName: string | null;
  onClearImage: () => void;
  onClearFile: () => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  /** One-line status under the row ("Opening the chat…"). */
  status?: string | null;
}) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? localRef;
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Auto-grow up to ~6 lines.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value, ref]);

  return (
    <div className="border-t border-[var(--sf-ink)]/[0.08] bg-[var(--sf-cream)] px-3 pb-3 pt-2.5 sm:px-4 [&>*]:mx-auto [&>*]:max-w-3xl">
      {imagePreview || fileName ? (
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
              <img src={imagePreview} alt="Photo to send" className="h-16 w-16 rounded-[14px] object-cover ring-1 ring-[var(--sf-ink)]/10" />
              <button
                type="button"
                onClick={onClearImage}
                aria-label="Remove photo"
                className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sf-ink)] text-white ring-2 ring-[var(--sf-cream)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>
          ) : null}
          {fileName ? (
            <span className="flex min-h-10 max-w-[70%] items-center gap-2 rounded-full bg-white pl-3 pr-1 ring-1 ring-[var(--sf-ink)]/10">
              <span className="text-[var(--sf-sage-deep)]"><DocIcon className="h-4 w-4" /></span>
              <span className="min-w-0 truncate text-[13.5px] font-bold">{fileName}</span>
              <button
                type="button"
                onClick={onClearFile}
                aria-label="Remove file"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--sf-soft)] hover:bg-[var(--sf-ink)]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
              >
                <CloseIcon />
              </button>
            </span>
          ) : null}
          <span className="sf-hand text-[15px] text-[var(--sf-sage-deep)]">ready to send</span>
        </div>
      ) : null}

      <div className="flex items-end gap-1.5">
        <input
          ref={imageInput}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onPickImage(f);
          }}
        />
        <input
          ref={fileInput}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onPickFile(f);
          }}
        />
        <button
          type="button"
          onClick={() => imageInput.current?.click()}
          disabled={disabled}
          aria-label="Attach image"
          title="Attach image"
          className={`${iconBtn} text-[var(--sf-sage-deep)]`}
        >
          <PhotoIcon />
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={disabled}
          aria-label="Attach file"
          title="Attach file"
          className={`${iconBtn} text-[var(--sf-sage-deep)]`}
        >
          <ClipIcon />
        </button>
        <label htmlFor={inputId} className="sr-only">
          Message
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={4000}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSend();
            }
          }}
          className="max-h-40 min-h-11 min-w-0 flex-1 resize-none rounded-[22px] bg-white px-4 py-[11px] text-[15px] font-semibold leading-[1.4] text-[var(--sf-ink)] ring-[1.5px] ring-[var(--sf-ink)]/10 placeholder:font-semibold placeholder:text-[var(--sf-soft)]/70 focus:outline-none focus:ring-[var(--sf-sage)] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label={busy ? "Sending" : "Send message"}
          aria-busy={busy || undefined}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--sf-coral-deep)] text-white shadow-[0_3px_0_0_#b85a4f] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-coral)]/40 active:translate-y-0.5 active:shadow-none disabled:translate-y-0 disabled:bg-[#d9d2c5] disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
        >
          {busy ? <Spinner /> : <SendIcon />}
        </button>
      </div>
      <p className="mt-1.5 hidden px-1 text-[11.5px] font-semibold text-[var(--sf-soft)]/70 sm:block" aria-live="polite">
        {status ?? "Enter to send · Shift + Enter for a new line"}
      </p>
      {status ? (
        <p className="mt-1.5 px-1 text-[11.5px] font-semibold text-[var(--sf-soft)]/70 sm:hidden" aria-hidden="true">
          {status}
        </p>
      ) : null}
    </div>
  );
}
