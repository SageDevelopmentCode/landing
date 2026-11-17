/** ISO date for the current /friday Field Day signup theme. Update when rolling the page. */
export const FRIDAY_PAGE_EVENT_DATE = "2026-11-20";

/** 8:30 AM CT drop-off — used for countdown on /friday. November is Central Standard Time. */
export const FRIDAY_PAGE_EVENT_COUNTDOWN_ISO = "2026-11-20T08:30:00-06:00";

/**
 * Per-event content for the Field Day Friday confirmation email and Discord embed.
 * Payments carry `event_date` in their Stripe metadata, so a resend always describes
 * the event that was actually paid for. When rolling the page, add an entry here
 * (and its `description` mapping below) instead of rewriting the email builder.
 */
export type FridayEmailEvent = {
  /** ISO date, e.g. "2026-11-20" */
  date: string;
  title: string;
  emoji: string;
  /** e.g. "Friday, November 20, 2026" */
  displayDate: string;
  agenda: Array<{ emoji: string; title: string; text: string }>;
  /** Theme-specific last line of the packing list */
  packExtra: { emoji: string; text: string };
};

export const FRIDAY_EMAIL_EVENTS: Record<string, FridayEmailEvent> = {
  "2026-11-13": {
    date: "2026-11-13",
    title: "Race Cars and Speedsters",
    emoji: "🏎️",
    displayDate: "Friday, November 13, 2026",
    agenda: [
      { emoji: "🎨", title: "Paint little race cars", text: "Paint and decorate little race cars to take home." },
      { emoji: "🏁", title: "Checkered Flags", text: "Make checkered flags to wave, hang, or show off." },
      { emoji: "🧩", title: "Paint car themed puzzles", text: "Paint car-themed puzzles for a take-home keepsake." },
    ],
    packExtra: { emoji: "🏁", text: "Optional racing colors or a checkered accessory" },
  },
  "2026-11-20": {
    date: "2026-11-20",
    title: "Thankful & Grateful",
    emoji: "🦃",
    displayDate: "Friday, November 20, 2026",
    agenda: [
      { emoji: "🦃", title: "Turkey face masks", text: "Make a feathered turkey mask to wear and take home." },
      { emoji: "🔑", title: "Gratitude keychains", text: "String a keychain that holds what you're thankful for." },
      { emoji: "🎨", title: "Thanksgiving ceramic paintings", text: "Paint a Thanksgiving ceramic piece to bring home." },
    ],
    packExtra: { emoji: "🍂", text: "Optional fall colors or a cozy layer" },
  },
};

/**
 * Payments made before `event_date` was added to Stripe metadata only carry the
 * theme-specific `description`; map those back to their event.
 */
const LEGACY_DESCRIPTION_TO_EVENT_DATE: Record<string, string> = {
  "Race Cars and Speedsters Field Day Fee": "2026-11-13",
  "Thankful & Grateful Field Day Fee": "2026-11-20",
};

/**
 * Resolve the event a Field Day Friday payment was for, from its Stripe metadata.
 * Returns null when the event can't be determined (e.g. older themes not in the
 * catalog) — callers should then avoid naming a specific date or theme.
 */
export function resolveFridayEmailEvent(
  meta: Record<string, string | undefined | null> | null | undefined,
): FridayEmailEvent | null {
  const eventDate =
    meta?.event_date ??
    (meta?.description ? LEGACY_DESCRIPTION_TO_EVENT_DATE[meta.description] : undefined);
  return (eventDate && FRIDAY_EMAIL_EVENTS[eventDate]) || null;
}
