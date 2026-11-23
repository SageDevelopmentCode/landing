// Billing data copied verbatim from the pre-redesign BillingPage.tsx. Do not edit prices here without a server-side change.
import { AFTERCARE_MONTHLY_CENTS, FUN_FRIDAY_MONTHLY_CENTS, FUN_FRIDAY_SESSION_MONTHLY_CENTS, type HomeschoolTier } from "@/shared/billing/school-year";

// --- Summer pricing ---
export const SUMMER_WEEKLY_CENTS = { primary: 37500, upper: 35000 };
export const SUMMER_FULL_CENTS = { primary: 405000, upper: 378000 };
export const SUMMER_FULL_ORIGINAL_CENTS = { primary: 450000, upper: 420000 };
export const TOTAL_WEEKS = 12;

export const SUMMER_WEEKS = [
  {
    week: 1,
    dates: "May 26\u201328",
    theme: "Welcome to Camp",
    emoji: "\ud83c\udfd5\ufe0f",
    highlights: [
      "Kick-Off Games",
      "Friendship Bracelets",
      "Water Balloon Race",
    ],
    days: ["tue", "wed", "thu"],
  },
  {
    week: 2,
    dates: "Jun 1\u20134",
    theme: "Mystery Camp Escape Challenge",
    emoji: "\ud83d\udd0d",
    highlights: ["Giant Slip & Slide", "Painted Stones", "DIY Camp Flags"],
  },
  {
    week: 3,
    dates: "Jun 8\u201311",
    theme: "Beach Day Bash",
    emoji: "\ud83c\udfd6\ufe0f",
    highlights: ["Ice Cream Bar", "Ocean Slime", "Seashell Painting"],
  },
  {
    week: 4,
    dates: "Jun 15\u201318",
    theme: "Scientist & Space Engineering Lab",
    emoji: "\ud83d\udd2c",
    highlights: ["Slime Lab", "Volcano Model", "Rocket Ship Craft"],
  },
  {
    week: 5,
    dates: "Jun 22\u201325",
    theme: "Safari Escape",
    emoji: "\ud83e\udd81",
    highlights: ["Safari Journals", "Animal Masks", "Clay Sculptures"],
  },
  {
    week: 6,
    dates: "Jun 29\u2013Jul 2",
    theme: "Splash Into Summer",
    emoji: "\ud83d\udca6",
    highlights: ["Water Relay Races", "Sponge Dodgeball", "Tie Dye Bandanas"],
  },
  {
    week: 7,
    dates: "Jul 6\u20139",
    theme: "Dino Hunt",
    emoji: "\ud83e\udd95",
    highlights: ["Dinosaur Dig", "Dino Egg Hunt", "Moon Sand"],
  },
  {
    week: 8,
    dates: "Jul 13\u201316",
    theme: "Pirate Adventure",
    emoji: "\ud83c\udff4\u200d\u2620\ufe0f",
    highlights: ["X Marks the Spot", "Pirate Hats", "Treasure Maps"],
  },
  {
    week: 9,
    dates: "Jul 20\u201323",
    theme: "You are a Superhero!",
    emoji: "\ud83e\uddb8",
    highlights: ["Hero Obstacle Course", "Superhero Masks", "Cape Decorating"],
  },
  {
    week: 10,
    dates: "Jul 27\u201330",
    theme: "Space Explorers: Mission to the Stars",
    emoji: "\ud83d\ude80",
    highlights: ["Rocket Launch Game", "Galaxy Paintings", "Planet Craft"],
  },
  {
    week: 11,
    dates: "Aug 3\u20136",
    theme: "Down on the Farm",
    emoji: "\ud83c\udf3e",
    highlights: ["Garden Scavenger Hunt", "Flower Pot Painting", "Sack Races"],
  },
  {
    week: 12,
    dates: "Aug 10\u201313",
    theme: "Finale of Camp",
    emoji: "\ud83c\udf89",
    highlights: ["Photo Booth", "Camp T-Shirts", "Memory Scrapbook"],
  },
];

// --- Aftercare pricing (summer) ---
export const AFTERCARE_MONTHS = [
  {
    key: "may",
    label: "May 2026",
    shortLabel: "May",
    days: [
      { label: "Mon May 26", date: "2026-05-26" },
      { label: "Tue May 27", date: "2026-05-27" },
      { label: "Wed May 28", date: "2026-05-28" },
      { label: "Thu May 29", date: "2026-05-29" },
    ],
  },
  {
    key: "jun",
    label: "June 2026",
    shortLabel: "Jun",
    days: [
      { label: "Mon Jun 1", date: "2026-06-01" },
      { label: "Tue Jun 2", date: "2026-06-02" },
      { label: "Wed Jun 3", date: "2026-06-03" },
      { label: "Thu Jun 4", date: "2026-06-04" },
      { label: "Mon Jun 8", date: "2026-06-08" },
      { label: "Tue Jun 9", date: "2026-06-09" },
      { label: "Wed Jun 10", date: "2026-06-10" },
      { label: "Thu Jun 11", date: "2026-06-11" },
      { label: "Mon Jun 15", date: "2026-06-15" },
      { label: "Tue Jun 16", date: "2026-06-16" },
      { label: "Wed Jun 17", date: "2026-06-17" },
      { label: "Thu Jun 18", date: "2026-06-18" },
      { label: "Mon Jun 22", date: "2026-06-22" },
      { label: "Tue Jun 23", date: "2026-06-23" },
      { label: "Wed Jun 24", date: "2026-06-24" },
      { label: "Thu Jun 25", date: "2026-06-25" },
      { label: "Mon Jun 29", date: "2026-06-29" },
      { label: "Tue Jun 30", date: "2026-06-30" },
    ],
  },
  {
    key: "jul",
    label: "July 2026",
    shortLabel: "Jul",
    days: [
      { label: "Wed Jul 1", date: "2026-07-01" },
      { label: "Thu Jul 2", date: "2026-07-02" },
      { label: "Mon Jul 6", date: "2026-07-06" },
      { label: "Tue Jul 7", date: "2026-07-07" },
      { label: "Wed Jul 8", date: "2026-07-08" },
      { label: "Thu Jul 9", date: "2026-07-09" },
      { label: "Mon Jul 13", date: "2026-07-13" },
      { label: "Tue Jul 14", date: "2026-07-14" },
      { label: "Wed Jul 15", date: "2026-07-15" },
      { label: "Thu Jul 16", date: "2026-07-16" },
      { label: "Mon Jul 20", date: "2026-07-20" },
      { label: "Tue Jul 21", date: "2026-07-21" },
      { label: "Wed Jul 22", date: "2026-07-22" },
      { label: "Thu Jul 23", date: "2026-07-23" },
      { label: "Mon Jul 27", date: "2026-07-27" },
      { label: "Tue Jul 28", date: "2026-07-28" },
      { label: "Wed Jul 29", date: "2026-07-29" },
      { label: "Thu Jul 30", date: "2026-07-30" },
    ],
  },
  {
    key: "aug",
    label: "August 2026",
    shortLabel: "Aug",
    days: [
      { label: "Mon Aug 3", date: "2026-08-03" },
      { label: "Tue Aug 4", date: "2026-08-04" },
      { label: "Wed Aug 5", date: "2026-08-05" },
      { label: "Thu Aug 6", date: "2026-08-06" },
      { label: "Mon Aug 10", date: "2026-08-10" },
      { label: "Tue Aug 11", date: "2026-08-11" },
      { label: "Wed Aug 12", date: "2026-08-12" },
      { label: "Thu Aug 13", date: "2026-08-13" },
    ],
  },
];

export function aftercareMonthCents(month: (typeof AFTERCARE_MONTHS)[number]): number {
  const normalMonthDayThreshold = 15;
  return month.days.length < normalMonthDayThreshold
    ? Math.round(month.days.length * 1868.75)
    : AFTERCARE_MONTHLY_CENTS;
}

// --- Fun Friday pricing (summer) ---
export const FUN_FRIDAY_MONTHS = [
  {
    key: "may",
    label: "May 2026",
    fridays: [{ label: "Fri May 29", date: "2026-05-29" }],
  },
  {
    key: "jun",
    label: "June 2026",
    fridays: [
      { label: "Fri Jun 5", date: "2026-06-05" },
      { label: "Fri Jun 12", date: "2026-06-12" },
      { label: "Fri Jun 19", date: "2026-06-19" },
      { label: "Fri Jun 26", date: "2026-06-26" },
    ],
  },
  {
    key: "jul",
    label: "July 2026",
    fridays: [
      { label: "Fri Jul 3", date: "2026-07-03" },
      { label: "Fri Jul 10", date: "2026-07-10" },
      { label: "Fri Jul 17", date: "2026-07-17" },
      { label: "Fri Jul 24", date: "2026-07-24" },
      { label: "Fri Jul 31", date: "2026-07-31" },
    ],
  },
  {
    key: "aug",
    label: "August 2026",
    fridays: [
      { label: "Fri Aug 7", date: "2026-08-07" },
      { label: "Fri Aug 14", date: "2026-08-14" },
    ],
  },
];

export function funFridayMonthCents(
  month: (typeof FUN_FRIDAY_MONTHS)[number],
): number {
  return month.fridays.length >= 4
    ? FUN_FRIDAY_MONTHLY_CENTS
    : month.fridays.length * FUN_FRIDAY_SESSION_MONTHLY_CENTS;
}

// --- Homeschool Drop-In pricing ---
// Summer: per-week rates
export const HOMESCHOOL_SUMMER_PRICING = {
  dropin: { primary: 10000, upper: 9500 }, // $100/day, $95/day
  "2day": { primary: 18000, upper: 17000 }, // $180/wk, $170/wk
  "3day": { primary: 25500, upper: 24000 }, // $255/wk, $240/wk
} as const;

export function deriveTier(dayCount: number): HomeschoolTier {
  if (dayCount === 1) return "dropin";
  if (dayCount === 2) return "2day";
  return "3day";
}

export function gradeTierLabel(tier: "primary" | "upper"): string {
  return tier === "primary" ? "Pre-K–1st Grade" : "2nd–4th Grade";
}

// --- Labels (verbatim) ---
export function formatProgramLabel(program: string | undefined | null): string | null {
  switch (program) {
    case "summer_26":
      return "Summer 2026";
    case "school_year_26_27":
      return "School Year 26–27";
    case "both":
      return "Summer & School Year";
    case "homeschool_drop_in":
      return "Homeschool Drop-In";
    default:
      return null;
  }
}

export function formatDropInProgramLabel(
  prog: string | null | undefined,
): string | null {
  switch (prog) {
    case "summer_26":
      return "Summer 2026";
    case "school_year_26_27":
      return "School Year 26–27";
    case "both":
      return "Summer & School Year";
    default:
      return null;
  }
}
export function formatPaymentType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
export function formatProgram(program: string): string {
  if (program === "summer_26") return "Summer 2026";
  if (program === "school_year_26_27") return "School Year 2026\u20132027";
  if (program === "homeschool_drop_in") return "Homeschool Drop-In";
  return program;
}
