"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { KidAvatar, Spinner, btnInkSm } from "@/app/parent/_garden/ui";
import { SkeletonList } from "@/app/parent/_garden/states";
import { searchUsers, type TeacherOrAdmin, type UserSearchResult } from "../actions";
import { roleLabel, type Recipient } from "./chat";
import { BackIcon, CloseIcon, iconBtn } from "./ChatBits";

/**
 * "New Message": a To: combobox (arrow keys + Enter) plus the "Teachers & Staff" cards.
 * The composer under it is rendered by the page so the send flow is shared with threads.
 */
export default function ComposePane({
  userId,
  recipient,
  onSelect,
  onRemove,
  onBack,
  suggestedStaff,
  staffLoading,
}: {
  userId: string;
  recipient: Recipient | null;
  onSelect: (r: Recipient) => void;
  onRemove: () => void;
  onBack: () => void;
  suggestedStaff: TeacherOrAdmin[];
  staffLoading: boolean;
}) {
  return (
    <>
      <div className="sticky top-0 z-10 border-b border-[var(--sf-ink)]/[0.08] bg-[var(--sf-cream)]/95 backdrop-blur">
        <div className="flex min-h-[60px] items-center gap-2 px-3 pt-2 sm:px-4">
          <button type="button" onClick={onBack} className={`${iconBtn} md:hidden`} aria-label="Back to inbox">
            <BackIcon />
          </button>
          <h2 className="sf-display text-2xl leading-none">New Message</h2>
        </div>
        <ToField userId={userId} recipient={recipient} onSelect={onSelect} onRemove={onRemove} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {recipient ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
            <KidAvatar id={recipient.id} name={recipient.full_name} imageUrl={recipient.profile_image_url} size="h-[72px] w-[72px] text-xl" />
            <p className="mt-1 text-base font-extrabold">No messages yet</p>
            <p className="sf-hand text-lg text-[var(--sf-sage-deep)]">say hi to {recipient.full_name.split(" ")[0]} 👋</p>
          </div>
        ) : staffLoading ? (
          <SkeletonList rows={3} rowClassName="h-[70px]" label="Loading teachers…" />
        ) : suggestedStaff.length > 0 ? (
          <section aria-labelledby="compose-staff-heading">
            <h3 id="compose-staff-heading" className="mb-4 text-sm font-extrabold text-[var(--sf-sage-deep)]">
              Teachers &amp; Staff
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {suggestedStaff.map((person) => (
                <li key={person.id} className="flex min-w-0 flex-col items-center gap-2 rounded-[24px] bg-white p-4 text-center shadow-[0_14px_36px_-28px_rgba(43,42,38,0.55)] ring-1 ring-[var(--sf-ink)]/[0.06]">
                  <KidAvatar id={person.id} name={person.full_name} imageUrl={person.profile_image_url} size="h-14 w-14 text-base" />
                  <span className="w-full min-w-0">
                    <span className="block truncate text-sm font-extrabold">{person.full_name}</span>
                    <span className="sf-hand block text-[15px] text-[var(--sf-sage-deep)]">Teacher</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelect(person)}
                    className={`${btnInkSm} w-full`}
                    aria-label={`Message ${person.full_name}`}
                  >
                    Message
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="py-8 text-center text-sm font-semibold text-[var(--sf-soft)]">Search for someone to start a conversation</p>
        )}

        {/* Parent directory ("Need a carpool or want to schedule a playdate?") stays turned off, as before.
            It grouped `getEnrolledParents(userId)` results into 🌱 Primary / 🚀 Lower Elementary / ✨ Other Families
            cards with a "Message" button. The action is kept in ../actions.ts; re-add the fetch here if it comes back. */}
      </div>
    </>
  );
}

function ToField({
  userId,
  recipient,
  onSelect,
  onRemove,
}: {
  userId: string;
  recipient: Recipient | null;
  onSelect: (r: Recipient) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqRef = useRef(0);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const trimmed = query.trim();
  const open = !recipient && !!trimmed && !dismissed;

  // Debounced search; stale responses are dropped.
  useEffect(() => {
    if (!trimmed) return;
    const token = ++reqRef.current;
    const t = setTimeout(async () => {
      setSearching(true);
      setFailed(false);
      try {
        const r = await searchUsers(trimmed, userId);
        if (token !== reqRef.current) return;
        setResults(r);
        setActiveIndex(r.length > 0 ? 0 : -1);
      } catch {
        if (token === reqRef.current) {
          setResults([]);
          setFailed(true);
        }
      } finally {
        if (token === reqRef.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [trimmed, userId]);

  // Focus the field whenever it (re)appears.
  useEffect(() => {
    if (!recipient) inputRef.current?.focus();
  }, [recipient]);

  function choose(r: UserSearchResult) {
    onSelect(r);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDismissed(false);
      if (results.length) setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length) setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        choose(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        setDismissed(true);
      }
    }
  }

  const showList = open && !searching && results.length > 0;

  return (
    <div className="relative px-3 pb-3 pt-2 sm:px-4">
      <div className="flex min-h-12 items-center gap-2 rounded-full bg-white px-4 ring-[1.5px] ring-[var(--sf-ink)]/10 focus-within:ring-[var(--sf-sage)]">
        <label htmlFor={`${listId}-input`} className="shrink-0 text-sm font-extrabold text-[var(--sf-soft)]">
          To:
        </label>
        {recipient ? (
          <span className="inline-flex min-h-9 min-w-0 items-center gap-1.5 rounded-full bg-[var(--sf-mint)] py-1 pl-1 pr-1 text-sm font-extrabold text-[var(--sf-sage-deep)]">
            <KidAvatar id={recipient.id} name={recipient.full_name} imageUrl={recipient.profile_image_url} size="h-7 w-7 text-[10px]" />
            <span className="min-w-0 truncate">{recipient.full_name}</span>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${recipient.full_name}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
            >
              <CloseIcon />
            </button>
          </span>
        ) : (
          <input
            ref={inputRef}
            id={`${listId}-input`}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            placeholder="Search by name..."
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDismissed(false);
              if (!e.target.value.trim()) {
                reqRef.current++;
                setResults([]);
                setSearching(false);
              }
            }}
            onKeyDown={onKeyDown}
            className="min-h-11 min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none placeholder:text-[var(--sf-soft)]/70"
          />
        )}
        {searching ? (
          <span className="text-[var(--sf-sage)]">
            <Spinner />
            <span className="sr-only">Searching…</span>
          </span>
        ) : null}
      </div>

      {open && !searching && results.length === 0 ? (
        <p className="absolute inset-x-3 top-full z-20 -mt-1 rounded-[20px] bg-white px-4 py-5 text-center text-sm font-semibold text-[var(--sf-soft)] shadow-[0_20px_50px_-20px_rgba(43,42,38,0.45)] ring-1 ring-[var(--sf-ink)]/[0.08] sm:inset-x-4" role="status">
          {failed ? "Couldn't search right now. Please try again." : "No users found"}
        </p>
      ) : null}
      <ul
        id={listId}
        role="listbox"
        aria-label="People"
        hidden={!showList}
        className="absolute inset-x-3 top-full z-20 -mt-1 max-h-72 overflow-y-auto rounded-[20px] bg-white py-1.5 shadow-[0_20px_50px_-20px_rgba(43,42,38,0.45)] ring-1 ring-[var(--sf-ink)]/[0.08] sm:inset-x-4"
      >
        {results.map((u, i) => (
          <li
            key={u.id}
            id={optionId(i)}
            role="option"
            aria-selected={i === activeIndex}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(u)}
            onMouseEnter={() => setActiveIndex(i)}
            className={`flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 ${i === activeIndex ? "bg-[var(--sf-butter)]/50" : ""}`}
          >
            <KidAvatar id={u.id} name={u.full_name} imageUrl={u.profile_image_url} size="h-9 w-9 text-xs" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold">{u.full_name}</span>
              {roleLabel(u.role) ? <span className="block text-xs font-semibold text-[var(--sf-soft)]/80">{roleLabel(u.role)}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
