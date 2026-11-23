// Teacher favorites — static answers from the teachers' "favorite things" form.
// Web copy for the parent Home "Teacher Favorites" section + sheet.
// Keep in sync with apps/mobile/src/features/teacher-favorites/teacherFavorites.ts
// (the mobile app keeps its own copy; it can't import repo-root shared/).
// Keep each teacher's words; only list punctuation was tidied into chips.

/** Mirrors the mobile GardenTint names used by the categories. */
export type FavoriteTint = "coral" | "butter" | "peach" | "lav" | "sky" | "mint" | "sage";

export type FavoriteListKey =
  | "drink"
  | "food"
  | "sweet"
  | "snack"
  | "shop"
  | "colors"
  | "scents"
  | "flowers"
  | "hobbies"
  | "giftCards"
  | "noThanks";

export type TeacherFavorites = {
  fullName: string;
  favorites: Partial<Record<FavoriteListKey, string[]>>;
  /** "Is there anything you've been wanting lately or something that would make your day?" */
  wish?: string;
};

export const TEACHER_FAVORITES: TeacherFavorites[] = [
  {
    fullName: "Edith DeLuna",
    favorites: {
      drink: ["Vanilla latte with oat milk"],
      food: ["Ramen Tatsu-Ya", "Buddy’s Burger"],
      sweet: ["Chocolate croissant", "Kit Kat"],
      snack: ["Strawberry cereal bar"],
      shop: ["Hobby Lobby", "Target", "Walmart", "H-E-B", "Ulta"],
      colors: ["Buttery yellow", "Light pink"],
      scents: ["Lavender", "Amber"],
      flowers: ["Roses", "Chamomile"],
      hobbies: ["Baking", "Hiking", "Shopping"],
      giftCards: ["A regular Visa gift card"],
    },
  },
  {
    fullName: "Joy Paige",
    favorites: {
      drink: ["Protein banana Matcha"],
      food: ["Allday Pizza", "Flower Child", "Joi"],
      sweet: ["Chocolate covered strawberries"],
      snack: ["Sunflower seeds (no flowers, just salty)"],
      shop: ["IKEA"],
      flowers: ["Tulips!"],
      hobbies: ["Running", "Pilates", "Learning how to play chess"],
      giftCards: ["Anthropology!"],
    },
  },
  {
    fullName: "Zelinda Melo",
    favorites: {
      drink: ["Pan tostado", "Coconut iced latte", "A chai from anywhere!", "Teapioca"],
      food: ["Chick-fil-A", "Cava", "Chipotle", "Hat Creek", "Frozen yogurt!!!"],
      sweet: ["Anything sour or spicy", "72% dark chocolate"],
      snack: ["Popcorn"],
      shop: ["Amazon", "Local gift shops", "Hobby Lobby"],
      colors: ["Sage green"],
      scents: ["Earthy", "Sandalwood", "Jasmine", "Frankincense"],
      flowers: ["Tulips", "Zinnias", "Poppies", "Cosmos"],
      hobbies: ["Being near a body of water", "Hiking"],
      giftCards: ["Any!"],
      noThanks: ["Mugs", "Sticky notes", "Bracelets", "Trinkets"],
    },
    wish: "Something intentional!",
  },
  {
    fullName: "Julius Cecilia",
    favorites: {
      drink: ["Milk tea boba"],
      food: ["Chipotle"],
      snack: ["Protein bars"],
      shop: ["Amazon"],
      colors: ["Black"],
      scents: ["Citrus"],
      hobbies: ["Working out"],
      giftCards: ["Amazon"],
      noThanks: ["Lotion", "Candles"],
    },
  },
  {
    fullName: "Sabrina Obnamia",
    favorites: {
      drink: ["Olipop", "Iced sugar free vanilla oat milk latte"],
      food: ["Chipotle", "Cava", "Poke Works"],
      sweet: ["Hu dark chocolate bites", "Unreal dark chocolate"],
      snack: [
        "Beef jerky",
        "Beef sticks",
        "Greek yogurt pouches (Siggi’s / Once Upon a Farm / Stonyfield)",
      ],
      colors: ["Light pink"],
      scents: ["Any natural fresh scents (no artificial fragrances)"],
      hobbies: ["Biking & swimming"],
    },
    wish: "A kind note! I would love to hear if there is anything positive that I have been able to cultivate into your families’ lives.",
  },
];

export type FavoriteCategory = {
  key: string;
  emoji: string;
  label: string;
  tint: FavoriteTint;
  /** Lists shown in this card; more than one renders as labelled sub-rows. */
  rows: { key: FavoriteListKey; label?: string }[];
};

/** Display order of the favorite cards. "No thanks" and the wish render separately. */
export const FAVORITE_CATEGORIES: FavoriteCategory[] = [
  { key: "drink", emoji: "☕", label: "Coffee & drinks", tint: "butter", rows: [{ key: "drink" }] },
  { key: "food", emoji: "🍜", label: "Restaurants", tint: "peach", rows: [{ key: "food" }] },
  { key: "sweet", emoji: "🍫", label: "Sweet treats", tint: "lav", rows: [{ key: "sweet" }] },
  { key: "snack", emoji: "🥨", label: "Snacks", tint: "butter", rows: [{ key: "snack" }] },
  { key: "shop", emoji: "🛍️", label: "Places to shop", tint: "sky", rows: [{ key: "shop" }] },
  {
    key: "vibes",
    emoji: "🌸",
    label: "Colors, scents & flowers",
    tint: "mint",
    rows: [
      { key: "colors", label: "Colors" },
      { key: "scents", label: "Scents" },
      { key: "flowers", label: "Flowers" },
    ],
  },
  { key: "hobbies", emoji: "🥾", label: "Outside of school", tint: "sage", rows: [{ key: "hobbies" }] },
  { key: "giftCards", emoji: "🎁", label: "Gift cards", tint: "lav", rows: [{ key: "giftCards" }] },
];

export function findTeacherFavorites(fullName: string | null | undefined) {
  if (!fullName) return undefined;
  const n = fullName.trim().toLowerCase();
  return TEACHER_FAVORITES.find((t) => t.fullName.toLowerCase() === n);
}

export function firstNameOf(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** Non-empty answers only; "None" means the teacher skipped it. */
export function cleanFavorites(list: string[] | undefined): string[] {
  return (list ?? []).filter((v) => v.trim() && v.trim().toLowerCase() !== "none");
}

/** Categories with at least one answer for this teacher, rows filtered to answered lists. */
export function visibleFavoriteCategories(t: TeacherFavorites) {
  return FAVORITE_CATEGORIES.map((c) => ({
    ...c,
    rows: c.rows
      .map((r) => ({ ...r, items: cleanFavorites(t.favorites[r.key]) }))
      .filter((r) => r.items.length > 0),
  })).filter((c) => c.rows.length > 0);
}

/** Home card teaser: first drink, else restaurant, else sweet treat. */
export function favoritesTeaser(t: TeacherFavorites): string | null {
  const drink = cleanFavorites(t.favorites.drink)[0];
  if (drink) return `☕ ${drink}`;
  const food = cleanFavorites(t.favorites.food)[0];
  if (food) return `🍜 ${food}`;
  const sweet = cleanFavorites(t.favorites.sweet)[0];
  return sweet ? `🍫 ${sweet}` : null;
}

export const TEACHER_FAVORITES_SEEN_KEY = "sagefield.teacherFavorites.seen.v1";
