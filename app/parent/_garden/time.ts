"use client";

import { useSyncExternalStore } from "react";

/**
 * The current time, rendered only after hydration (server snapshot is `null`), so clock-dependent UI
 * ("today", current-time lines, relative times) never mismatches between server (UTC) and browser.
 * Ticks every `intervalMs` (default 60s). All subscribers with the same interval share one timer.
 */
type ClockStore = { subscribe: (cb: () => void) => () => void; getSnapshot: () => number };
const stores = new Map<number, ClockStore>();

function clockStore(intervalMs: number): ClockStore {
  const existing = stores.get(intervalMs);
  if (existing) return existing;
  const listeners = new Set<() => void>();
  let id: ReturnType<typeof setInterval> | null = null;
  let now = Date.now();
  const store: ClockStore = {
    subscribe(cb) {
      listeners.add(cb);
      if (id === null) {
        now = Date.now();
        id = setInterval(() => {
          now = Date.now();
          listeners.forEach((l) => l());
        }, intervalMs);
      }
      return () => {
        listeners.delete(cb);
        if (listeners.size === 0 && id !== null) {
          clearInterval(id);
          id = null;
        }
      };
    },
    getSnapshot: () => now,
  };
  stores.set(intervalMs, store);
  return store;
}

const serverSnapshot = () => null;

export function useNow(intervalMs = 60_000): Date | null {
  const store = clockStore(intervalMs);
  const ms = useSyncExternalStore(store.subscribe, store.getSnapshot, serverSnapshot);
  return ms === null ? null : new Date(ms);
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole calendar days between two dates (b - a), ignoring time of day. */
export function calendarDaysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86_400_000);
}

/**
 * Inbox-style relative time using calendar days, not 24h blocks:
 * today → "3:42 pm", yesterday → "Yesterday", within 6 days → "Tue", same year → "Nov 3", else "Nov 3, 2025".
 */
export function formatRelative(iso: string | Date, now: Date = new Date()): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const days = calendarDaysBetween(d, now);
  if (days <= 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Day separator label for chat threads: "Today", "Yesterday", or "Monday, Nov 3". */
export function formatDayHeading(iso: string | Date, now: Date = new Date()): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const days = calendarDaysBetween(d, now);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}
