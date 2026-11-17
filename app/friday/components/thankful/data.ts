/** Content and shared state for the "Thankful & Grateful" Field Friday page. */

export const EVENT = {
  title: "Thankful & Grateful",
  tag: "Field Day",
  shortDate: "Nov 20",
  longDate: "Nov 20, 2026",
  weekdayDate: "Friday, Nov 20",
  ordinalDate: "Friday, November 20th",
  dropOff: "8:30 AM",
  pickUp: "1:30 PM",
  ages: "4–11",
} as const;

// ─── Autumn palette (layered on top of the Garden tokens) ────────────────────

export const TG = {
  pumpkin: "#EE8434",
  pumpkinDeep: "#C4621C",
  cranberry: "#B23A48",
  mustard: "#F4C04E",
  wheat: "#F6E3BF",
  cinnamon: "#C8643B",
  cocoa: "#4A3426",
  forest: "#2E4535",
  sage: "#6b9474",
  cream: "#fff8ef",
} as const;

/** Solid section backgrounds, so the scalloped dividers can match them exactly. */
export const BG = {
  cream: "#fff8ef",
  wheat: "#F8E9CF",
  forest: "#2E4535",
  sage: "#E8F3E3",
  peach: "#FFEADB",
  butter: "#FFEFB8",
} as const;

// ─── Turkey mascot ───────────────────────────────────────────────────────────

export type Plumage = { id: string; name: string; feathers: string[] };

export const PLUMAGES: Plumage[] = [
  { id: "harvest", name: "Harvest", feathers: ["#EE8434", "#F4C04E", "#B23A48", "#6b9474"] },
  { id: "cranberry", name: "Cranberry", feathers: ["#B23A48", "#E8707D", "#7A2333", "#F6C9A8"] },
  { id: "sunflower", name: "Sunflower", feathers: ["#F4C04E", "#EE8434", "#F8DC8C", "#C8643B"] },
  { id: "maple", name: "Maple", feathers: ["#C8643B", "#8C3B22", "#EE8434", "#F4C04E"] },
  { id: "rainbow", name: "Rainbow", feathers: ["#E8707D", "#EE8434", "#F4C04E", "#6b9474", "#5B8DC9", "#9B6BB5"] },
];

export type AccessoryId = "none" | "scarf" | "bowtie" | "crown" | "glasses";

export const ACCESSORIES: { id: AccessoryId; name: string; emoji: string }[] = [
  { id: "none", name: "Just me", emoji: "🦃" },
  { id: "scarf", name: "Cozy scarf", emoji: "🧣" },
  { id: "bowtie", name: "Bow tie", emoji: "🎀" },
  { id: "crown", name: "Leaf crown", emoji: "🍂" },
  { id: "glasses", name: "Glasses", emoji: "👓" },
];

export type TurkeyChoice = { plumageIndex: number; accessory: AccessoryId };

export const DEFAULT_TURKEY: TurkeyChoice = { plumageIndex: 0, accessory: "scarf" };

export const plumageFor = (index: number) =>
  PLUMAGES[((index % PLUMAGES.length) + PLUMAGES.length) % PLUMAGES.length];

const TURKEY_STORAGE_KEY = "friday-turkey";

/** Remembers the turkey through the Stripe redirect so it can greet you on the success page. */
export function saveTurkeyChoice(turkey: TurkeyChoice) {
  try {
    sessionStorage.setItem(TURKEY_STORAGE_KEY, JSON.stringify(turkey));
  } catch {
    // Storage can be blocked; the success page falls back to the default turkey.
  }
}

export function loadTurkeyChoice(): TurkeyChoice {
  try {
    const saved = JSON.parse(sessionStorage.getItem(TURKEY_STORAGE_KEY) ?? "null");
    const accessory = ACCESSORIES.find((a) => a.id === saved?.accessory)?.id;
    if (Number.isInteger(saved?.plumageIndex) && accessory) {
      return { plumageIndex: saved.plumageIndex, accessory };
    }
  } catch {
    // Fall through to the default turkey.
  }
  return DEFAULT_TURKEY;
}

// ─── Crafts ──────────────────────────────────────────────────────────────────

export type CraftId = "mask" | "keychain" | "ceramic";

export const CRAFTS: { id: CraftId; title: string; plate: string; desc: string; color: string; tint: string }[] = [
  {
    id: "mask",
    title: "Turkey face masks",
    plate: "Gobble Station",
    desc: "Make a feathered turkey mask to wear and take home.",
    color: TG.pumpkin,
    tint: "#FFE3CC",
  },
  {
    id: "keychain",
    title: "Gratitude keychains",
    plate: "Thanks Table",
    desc: "String a keychain that holds what you're thankful for.",
    color: TG.cranberry,
    tint: "#F9D9DD",
  },
  {
    id: "ceramic",
    title: "Thanksgiving ceramic paintings",
    plate: "Paint Pantry",
    desc: "Paint a Thanksgiving ceramic piece to bring home.",
    color: TG.mustard,
    tint: "#FFF0C4",
  },
];

/** "turkey face masks, gratitude keychains, and Thanksgiving ceramic paintings" (mid-sentence casing). */
export function craftTitleList(): string {
  const titles = CRAFTS.map((c) => c.title.charAt(0).toLowerCase() + c.title.slice(1))
    // Keep "Thanksgiving" capitalized.
    .map((t) => t.replace(/^thanksgiving/, "Thanksgiving"));
  if (titles.length < 2) return titles.join("");
  return `${titles.slice(0, -1).join(", ")}, and ${titles[titles.length - 1]}`;
}

// ─── Photos and place ────────────────────────────────────────────────────────

const WEEK_TWELVE = "/assets/highlights/school_week_twelve";

export const PHOTOS = [
  "0A7EB988-ECAE-43A3-9DF0-F4373EF6C013.JPG",
  "10CC9173-98B8-4C61-AC26-BC47AD794446.JPG",
  "23219CC1-98DB-4B4C-96D5-B770AF8E4EE4.JPG",
  "3372BC8C-4A29-4604-A768-C788925A1CF2.JPG",
  "3A2D9CC2-CBC0-4FB5-B939-1F5943B71917.JPG",
  "42204CE0-4F42-4137-86B2-EEAB2C602047.JPG",
  "4843EA7B-0555-471A-980A-201D5D946C20.JPG",
  "48D42281-6276-4268-8D8A-D43437EF17C7.JPG",
  "4C91BE96-1DAA-442A-9D31-D18B017CBACC.JPG",
  "530085FA-8419-4772-B7BC-F8432A1A6C8B.JPG",
  "5F89FB6A-BC40-40AE-9CF5-AD11C088BCB3.JPG",
  "7F63D5AB-60B2-4394-9B75-05074B9928CA.JPG",
].map((file) => `${WEEK_TWELVE}/${file}`);

export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=2760+Gattis+School+Rd%2C+Round+Rock+TX";
export const ADDRESS = "2760 Gattis School Rd, Round Rock TX";

/** Leaf-colored confetti for celebrations. */
export async function leafConfetti(origin = { y: 0.6 }) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  void confetti({
    particleCount: 150,
    spread: 110,
    origin,
    colors: [TG.pumpkin, TG.mustard, TG.cranberry, TG.cinnamon, TG.sage],
  });
}
