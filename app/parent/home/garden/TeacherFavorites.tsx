"use client";

import { useCallback, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  TEACHER_FAVORITES,
  TEACHER_FAVORITES_SEEN_KEY,
  cleanFavorites,
  favoritesTeaser,
  findTeacherFavorites,
  firstNameOf,
  visibleFavoriteCategories,
  type FavoriteTint,
} from "@/shared/parent/teacher-favorites";
import type { TeacherPhotoMap } from "@/app/lib/get-teacher-favorite-photos";
import GardenSheet from "@/app/parent/_garden/sheet";
import { Arrow, KidAvatar, SectionHeader, TINT_BG, TINT_FG, linkSoft, type HomeTint } from "@/app/parent/_garden/ui";

/* ─── "New!" flag (per browser, like the mobile device flag) ─────────────── */

const seenListeners = new Set<() => void>();

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(TEACHER_FAVORITES_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** `null` until read after hydration, so the pill never flickers in. */
export function useTeacherFavoritesSeen(readOnly: boolean | undefined) {
  const seen = useSyncExternalStore<boolean | null>(
    (cb) => {
      seenListeners.add(cb);
      return () => {
        seenListeners.delete(cb);
      };
    },
    readSeen,
    () => null,
  );
  const markSeen = useCallback(() => {
    // An admin previewing a parent shouldn't clear anything.
    if (readOnly) return;
    try {
      window.localStorage.setItem(TEACHER_FAVORITES_SEEN_KEY, "1");
    } catch {
      // Non-critical: the pill just shows again next time.
    }
    seenListeners.forEach((l) => l());
  }, [readOnly]);
  return { seen, markSeen };
}

const tint = (t: FavoriteTint): HomeTint => (t === "sage" ? "mint" : t);

export function photoFor(photos: TeacherPhotoMap, fullName: string) {
  return photos[fullName.toLowerCase()] ?? null;
}

/* ─── Home section ────────────────────────────────────────────────────────── */

const CARD_TILTS = ["-1.5deg", "1.5deg", "-1deg", "2deg", "-2deg"];

export function TeacherFavoritesSection({
  photos,
  isNew,
  onOpen,
}: {
  photos: TeacherPhotoMap;
  isNew: boolean;
  onOpen: (teacher?: string) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="home-teacher-favorites">
      <SectionHeader
        id="home-teacher-favorites"
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            Teacher Favorites
            <AnimatePresence>
              {isNew ? (
                <motion.span
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-block rounded-full bg-[var(--sf-coral-deep)] px-2.5 py-1 align-middle text-xs font-extrabold tracking-wide text-white"
                  style={{ rotate: "-4deg", fontFamily: "var(--font-sf-body)" }}
                >
                  New!
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
        }
        note="a little gift guide 🎁"
        action={
          <button type="button" onClick={() => onOpen()} className={`${linkSoft} cursor-pointer`}>
            View all <Arrow />
          </button>
        }
      />
      <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 -mb-4 pb-8 pt-2 [scroll-padding-inline:1.5rem] scrollbar-hide" role="list">
        {TEACHER_FAVORITES.map((t, i) => {
          const teaser = favoritesTeaser(t);
          return (
            <div key={t.fullName} role="listitem" className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => onOpen(t.fullName)}
                aria-label={`See ${t.fullName}'s favorites`}
                className="group flex h-full w-[168px] flex-col items-center gap-2 rounded-[26px] bg-white px-3 pb-4 pt-5 text-center shadow-[0_18px_40px_-28px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.06] transition-[rotate,translate] duration-300 hover:!rotate-0 hover:-translate-y-1 focus-visible:!rotate-0 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
                style={{ rotate: CARD_TILTS[i % CARD_TILTS.length] }}
              >
                <span className="rounded-full p-1 ring-2 ring-[var(--sf-butter)] transition group-hover:ring-[var(--sf-coral)]">
                  <KidAvatar id={t.fullName} name={t.fullName} imageUrl={photoFor(photos, t.fullName)} size="h-16 w-16 text-lg" />
                </span>
                <span className="sf-display text-xl leading-tight">{firstNameOf(t.fullName)}</span>
                {teaser ? <span className="line-clamp-2 text-xs font-bold leading-snug text-[var(--sf-soft)]">{teaser}</span> : null}
                <span className="sf-hand mt-auto pt-1 text-base leading-none text-[var(--sf-sage-deep)] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
                  peek inside →
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Sheet ───────────────────────────────────────────────────────────────── */

function Chips({ items, onWhite = false }: { items: string[]; onWhite?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className={`rounded-full px-3 py-1.5 text-sm font-bold leading-snug text-[var(--sf-ink)] ${
            onWhite ? "bg-[var(--sf-coral)]/15" : "bg-white/85"
          }`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function TeacherFavoritesSheet({
  open,
  onClose,
  selected,
  onSelect,
  photos,
}: {
  open: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (fullName: string) => void;
  photos: TeacherPhotoMap;
}) {
  const reduce = useReducedMotion();
  const t = findTeacherFavorites(selected) ?? TEACHER_FAVORITES[0];
  const cats = visibleFavoriteCategories(t);
  const noThanks = cleanFavorites(t.favorites.noThanks);
  const first = firstNameOf(t.fullName);

  return (
    <GardenSheet
      open={open}
      onClose={onClose}
      icon="🎁"
      title="Teacher Favorites"
      note="a little gift guide"
      toolbar={
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-hide" role="tablist" aria-label="Teachers">
          {TEACHER_FAVORITES.map((teacher) => {
            const on = teacher.fullName === t.fullName;
            return (
              <button
                key={teacher.fullName}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={`${teacher.fullName}'s favorites`}
                onClick={() => onSelect(teacher.fullName)}
                className="flex min-w-[68px] shrink-0 flex-col items-center gap-1 rounded-2xl px-1.5 py-1.5 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer"
              >
                <span className={`rounded-full p-[3px] transition ${on ? "bg-[var(--sf-coral-deep)]" : "bg-transparent ring-2 ring-[var(--sf-ink)]/10"}`}>
                  <KidAvatar id={teacher.fullName} name={teacher.fullName} imageUrl={photoFor(photos, teacher.fullName)} size="h-12 w-12 text-sm" />
                </span>
                <span className={`text-xs leading-tight ${on ? "font-extrabold text-[var(--sf-ink)]" : "font-bold text-[var(--sf-soft)]"}`}>
                  {firstNameOf(teacher.fullName)}
                </span>
              </button>
            );
          })}
        </div>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={t.fullName}
          role="tabpanel"
          aria-label={`${t.fullName}'s favorites`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-3.5 rounded-[24px] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(43,42,38,0.5)]">
            <KidAvatar id={t.fullName} name={t.fullName} imageUrl={photoFor(photos, t.fullName)} size="h-16 w-16 text-lg" />
            <div className="min-w-0">
              <h3 className="sf-display text-2xl leading-tight">{t.fullName}</h3>
              <p className="sf-hand text-lg leading-tight text-[var(--sf-sage-deep)]">a few of {first}&rsquo;s favorite things</p>
            </div>
          </div>

          {cats.map((c) => (
            <div key={c.key} className={`rounded-[24px] p-4 ${TINT_BG[tint(c.tint)]}`}>
              <h4 className={`mb-2.5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide ${TINT_FG[tint(c.tint)]}`}>
                <span className="text-lg" aria-hidden="true">
                  {c.emoji}
                </span>
                {c.label}
              </h4>
              <div className="flex flex-col gap-3">
                {c.rows.map((r) => (
                  <div key={r.key}>
                    {r.label ? <p className="mb-1.5 text-xs font-extrabold text-[var(--sf-soft)]">{r.label}</p> : null}
                    <Chips items={r.items} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {noThanks.length > 0 ? (
            <div className="rounded-[24px] border-2 border-dashed border-[var(--sf-coral)]/50 bg-white p-4">
              <h4 className="mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-[var(--sf-coral-deep)]">
                <span className="text-lg" aria-hidden="true">
                  🙅
                </span>
                Thanks, but no thanks!
              </h4>
              <p className="mb-2.5 text-sm font-bold text-[var(--sf-soft)]">I have enough of:</p>
              <Chips items={noThanks} onWhite />
            </div>
          ) : null}

          {t.wish ? (
            <div
              className="mx-1 mt-3 rounded-[6px] bg-[var(--sf-butter)] px-5 pb-5 pt-4 shadow-[0_18px_30px_-18px_rgba(43,42,38,0.55)]"
              style={{ rotate: "1.2deg" }}
            >
              <p className="sf-hand text-lg leading-none text-[#7a5a00]">would make my day →</p>
              <p className="mt-2 text-[15px] font-bold leading-relaxed text-[var(--sf-ink)]">&ldquo;{t.wish}&rdquo;</p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </GardenSheet>
  );
}
