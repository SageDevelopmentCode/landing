# Friday Field Day Page — Reference

## Files touched each roll

| File | Action |
| ---- | ------ |
| `app/friday/page.tsx` | Theme copy, activities, photos, countdown, palette tokens, agreement strings |
| `app/friday/components/{Theme}HeroScene.tsx` | Reuse `DesertHeroScene.tsx` or fork for new motif |
| `app/api/friday-register/route.ts` | Stripe `product_data.name`, `description`, metadata |
| `app/friday/success/page.tsx` | Confirmation copy + accent colors |
| `app/page.tsx` | Field Day Friday Preview section (~lines 177–320) |

## Activity object schema

Each Field Day has **exactly 4 activities**. Define a constant (currently `DESERT_DISCOVERY_ACTIVITIES`) at the top of `app/friday/page.tsx`:

```typescript
const THEME_ACTIVITIES = [
  {
    emoji: "🦎",
    title: "Desert Animal Scavenger Hunt",
    waypoint: "Track Station",
    desc: "Follow tracks and clues across Sage Field to discover hidden desert creatures — lizards, jackrabbits, roadrunners, and more!",
    accent: "#f5e6c8",
    accentText: "#5C7A3A",
  },
  // ... 3 more
];
```

| Field | Use |
| ----- | --- |
| `emoji` | Flip card front, homepage activity chip |
| `title` | Card heading, activity strip, agreement context |
| `waypoint` | Expedition trail label on flip card front |
| `desc` | Flip card back (parent-friendly, 1–2 sentences) |
| `accent` | Card background tint |
| `accentText` | Card title color on front |

**Waypoint naming:** Short evocative station names (Track Station, Art Oasis, Bingo Camp, Dune Valley) — match theme vibe.

## Copy locations in `app/friday/page.tsx`

Grep the previous theme name and update every occurrence:

| Location | Example pattern |
| -------- | --------------- |
| Countdown effect | `new Date("2026-09-18T08:30:00-05:00")` |
| Hero H1 | Theme title (Bebas Neue) |
| Hero tagline | Subtitle paragraph |
| Date pill | `Sept 18, 2026` |
| Hero badge | `Desert Discovery · Sept 18` |
| Activity section subtitle | Comma-separated activity names |
| Packing checklist intro | `don't forget anything for {Theme}!` |
| Bottom CTA badge | `This Friday Only · Sept 18` |
| Bottom CTA heading | `Don't miss {Theme}.` |
| Bottom CTA body | `{Month Day} is one day...` |
| Sticky bar | `🌵 {Theme} · Sept 18` |
| Agreement drawer title | `{Theme} Participant Agreement` |
| Agreement location line | `{Theme}: September 18, 2026` |
| Agreement body paragraphs | `{Theme}` in participation/release copy |

## Stripe labels (`app/api/friday-register/route.ts`)

```typescript
product_data: {
  name: "Desert Discovery — September 18",
  description: `Sage Field Private School · $${FUN_FRIDAY_DROPIN_CENTS / 100} per child · September 18, 2026`,
},
// metadata:
description: "Desert Discovery Field Day Fee",
```

Date format in `name`: `{Month} {Day}` without year. Full date with year in `description`.

## Success page (`app/friday/success/page.tsx`)

Update:

- Main paragraph: `We'll see you Friday, {ordinal date} for {Theme} at Sage Field...`
- Activity recap sentence listing all 4 activities
- Optional: component export name (e.g. `DesertDiscoverySuccessPage` → `{Theme}SuccessPage`) — cosmetic only

## Homepage promo (`app/page.tsx`)

Field Day Friday Preview section — update in sync with Friday page:

| Element | Notes |
| ------- | ----- |
| Badge | `This Friday · {short date} · Limited Spots` |
| Theme H2 | Theme name (fdf-desert-headline class — rename optional) |
| Tagline | Same as or shorter than Friday hero tagline |
| Pills | Date, 8:30 AM – 1:30 PM, price, Ages 4–11 |
| Activity grid | 4 chips: emoji + short title |
| CTA | `href="/friday"` |
| Hero scene | `{Theme}HeroScene compact` |

## Theme palette (`DESERT_THEME`)

Exported from [`app/friday/components/DesertHeroScene.tsx`](../../../app/friday/components/DesertHeroScene.tsx):

| Token | Current hex | Typical use |
| ----- | ----------- | ----------- |
| `skyPeach` | `#FFF3E4` | Page background, section fills |
| `skyGlow` | `#FFE8CC` | Sky gradient end |
| `sunCore` | `#FFF9E1` | Sun, warm highlights |
| `duneDeep` | `#E07A2F` | Primary accent, buttons |
| `duneMid` | `#F2A65A` | Mid-tone surfaces, borders |
| `duneLight` | `#F7C98B` | Light section backgrounds |
| `cactusGreen` | `#4CAF50` | Motif accent in SVG |
| `rockOrange` | `#D97706` | Rocks, secondary accent |
| `inkBrown` | `#5C3D2E` | Body text on light backgrounds |
| `terracotta` | `#C4603C` | CTA gradients, badges |

When forking a new hero, export the same shape of tokens so `page.tsx` style references stay consistent.

## Photo selection

Paths use web prefix `/assets/highlights/{folder}/{filename}` (no `public/`).

| Constant | Count | Purpose |
| -------- | ----- | ------- |
| `HERO_IMAGES` | 3 | Rotating hero photo stack |
| `CAROUSEL_IMAGES` | 6–8 | Week recap carousel |

Selection tips:

- Pick action shots with clear faces/activity when possible
- Preserve exact filenames (some have spaces or UUID casing)
- Run compression before commit:

```bash
npm run compress:highlights -- public/assets/highlights/school_week_four
```

If `sharp` fails, use macOS `sips` fallback from [newsletter-highlights-page/reference.md](../newsletter-highlights-page/reference.md).

## Grep checklist

After each roll, confirm zero hits for the **previous** theme:

```bash
rg "Desert Discovery" app/friday app/api/friday-register app/page.tsx
rg "September 18|Sept 18|2026-09-18" app/friday app/api/friday-register app/page.tsx
```

If hero was forked, also grep old component import:

```bash
rg "DesertHeroScene" app/friday app/page.tsx
```

## What stays unchanged

| Item | Location / value |
| ---- | ---------------- |
| Drop-in price | `FUN_FRIDAY_DROPIN_CENTS` from `shared/billing/school-year.ts` |
| Drop-off / pick-up | 8:30 AM / 1:30 PM |
| Ages | 4–11 |
| Address | Sage Field campus, Round Rock |
| Form endpoint | POST `/api/friday-register` |
| Legal `ACTIVITIES` array | Generic outdoor activities list |
| Legal `RISKS` array | Generic liability risks |
| Registration fields | Parent name, email, phone, children, agreement checkbox |

## Default packing list

Theme-specific intro only; base items in `PACKING_LIST`:

- Closed-toe shoes
- Sun hat or cap
- Sunscreen (applied before drop-off)
- Water bottle, labeled
- Snack + lunch from home
- Old clothes (outdoor play)
- Small backpack for creations
- Optional themed accessory (bandana, vest, etc.)

Swap the optional last item or add theme-specific lines when user provides packing tweaks.

## Historical theme examples

| Week | Theme | Activities (summary) |
| ---- | ----- | -------------------- |
| — | Wild Safari | Animal silhouettes, safari binoculars, safari bingo, animal hide-and-seek |
| — | Construction Zone | Oobleck cement dig, hard-hat decorating, LEGO building |
| Week 4 | Desert Discovery | Desert animal scavenger hunt, cactus painting, desert bingo, sand dune adventures |

Highlights-page Field Friday blocks use similar activity lists but live on `/highlights/school-year/week-N` — separate from this signup workflow.

## Related skills

| Skill | When |
| ----- | ---- |
| [newsletter-highlights-page](../newsletter-highlights-page/SKILL.md) | Week recap page + Field Friday section in highlights |
| [newsletter-carousel-highlights](../newsletter-carousel-highlights/SKILL.md) | Instagram carousel copy |
| [school-year-newsletter-email](../school-year-newsletter-email/SKILL.md) | Parent outreach email from Supabase newsletter |
