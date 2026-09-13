---
name: friday-field-day-page
description: >-
  Roll the Field Day Friday landing page, Stripe checkout labels, success page,
  and homepage promo for a new theme and date. Use when updating /friday,
  Field Day Friday signup, or when the user provides a theme, date, and activities.
---

# Friday Field Day Page

Roll the live Field Day Friday signup experience for a new theme and date: landing page, Stripe checkout labels, success page, and homepage promo block.

**Content + visual workflow** — swaps theme copy and optionally forks the warm-illustration hero. For week highlights recap copy only, use [newsletter-highlights-page](../newsletter-highlights-page/SKILL.md). For parent newsletter email, use [school-year-newsletter-email](../school-year-newsletter-email/SKILL.md).

## When to use

- User asks to update Field Day, `/friday`, or the Friday signup page
- User provides a theme name, date, and activities for the next Field Day Friday
- User references `@friday-field-day-page`

## Prerequisites

- User confirms theme name, display date, countdown ISO, hero tagline, and **4 activities**
- Photo folder under `public/assets/highlights/` if updating hero/carousel images (optional — reuse current paths if omitted)
- Visual direction decided: reuse current warm illustration or fork a new hero motif

## Required inputs

Ask if not provided:

| Input | Example | Required |
| ----- | ------- | -------- |
| Theme name | Desert Discovery | Yes |
| Date (display) | Friday, September 18, 2026 | Yes |
| Countdown ISO | `2026-09-18T08:30:00-05:00` (8:30 AM CT drop-off) | Yes |
| Hero tagline | One sentence under the theme title | Yes |
| 4 activities | emoji, title, waypoint label, parent-friendly blurb | Yes |
| Photo folder | `public/assets/highlights/school_week_four` | Optional |
| Visual direction | `reuse warm illustration` or brief motif (ocean, winter, safari…) | Optional |
| Packing list tweaks | Theme-specific items only | Optional |

### Copy-paste template

Give the user this block to fill in:

```markdown
Theme:
Date (display):
Countdown ISO:
Hero tagline:

Activities:
1. emoji | title | waypoint | description
2. emoji | title | waypoint | description
3. emoji | title | waypoint | description
4. emoji | title | waypoint | description

Photos: public/assets/highlights/...
Visual: reuse warm illustration | new motif: ...
Packing tweaks (optional):
```

**Verbatim rule:** Theme name, activity titles, and user-provided descriptions go into the page **exactly as given** — no paraphrasing.

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Confirm inputs (theme, date, 4 activities, visual direction)
- [ ] Step 2: Visual theme — reuse or fork hero scene + palette
- [ ] Step 3: Update app/friday/page.tsx content + styling tokens
- [ ] Step 4: Update app/api/friday-register/route.ts Stripe labels
- [ ] Step 5: Update app/friday/success/page.tsx confirmation copy
- [ ] Step 6: Update app/page.tsx homepage Field Day promo block
- [ ] Step 7: Grep for stale theme/date strings
- [ ] Step 8: npx tsc --noEmit + spot-check /friday and homepage
```

### Step 1: Confirm inputs

Before editing, verify:

- Theme name and all 4 activity titles/descriptions
- Display date variants needed: short (`Sept 18`), long (`September 18, 2026`), ordinal (`September 18th`)
- Countdown ISO uses **8:30 AM Central** (`T08:30:00-05:00`) to match drop-off time
- Photo folder exists if user wants new hero/carousel images
- Visual direction: reuse palette + `DesertHeroScene` vs fork new hero component

### Step 2: Visual theme

Two paths — pick one based on user input:

**A. Reuse warm-illustration system** (fast weekly roll)

- Keep layout: light sky background, frosted hero card, expedition flip cards, warm section dividers
- Swap copy, `DESERT_THEME` token values, activity accent colors, and photo paths
- Keep [`app/friday/components/DesertHeroScene.tsx`](../../../app/friday/components/DesertHeroScene.tsx) as-is unless palette hex values should shift to match theme mood
- Renaming `DESERT_THEME` → `FIELD_DAY_THEME` is optional; not required every week

**B. New visual motif** (when theme warrants it)

- Fork hero → e.g. `app/friday/components/OceanHeroScene.tsx`
- Export a `THEME` constant (sky, accent, ink, surface colors) following the `DESERT_THEME` pattern in [`DesertHeroScene.tsx`](../../../app/friday/components/DesertHeroScene.tsx)
- SVG layers: sky gradient, focal motif (sun → moon, dunes → waves, etc.), ground line, `compact` prop for homepage
- Read the frontend-design skill for palette/motif decisions
- **Do not** reintroduce removed dark/gimmick UI (emoji track stamps, compass tap, cursor sparkle, dark twilight gradients)
- Update imports in [`app/friday/page.tsx`](../../../app/friday/page.tsx) and [`app/page.tsx`](../../../app/page.tsx)

### Step 3: Update `app/friday/page.tsx`

Primary surface — see [reference.md](reference.md) for full touch map.

Key areas:

| Area | What changes |
| ---- | ------------ |
| Countdown | `new Date("{ISO}")` in countdown effect |
| Activity constant | 4 items with `emoji`, `title`, `waypoint`, `desc`, `accent`, `accentText` |
| Hero | Theme title, tagline, date pills, sticky bar label |
| Photos | `HERO_IMAGES` (3), `CAROUSEL_IMAGES` (6–8) |
| Sections | Activity subtitle, packing intro, bottom CTA, agreement drawer |
| Theme tokens | All `DESERT_THEME.*` / inline hex references |

**Do not change:** form POST to `/api/friday-register`, `FUN_FRIDAY_DROPIN_CENTS` pricing, drop-off 8:30 AM / pick-up 1:30 PM, ages 4–11, address, `ACTIVITIES` / `RISKS` legal arrays, registration validation.

If user provided packing tweaks, update `PACKING_LIST` items only — keep standard sun/shoes/water/lunch items unless user replaces them.

Compress new photos first:

```bash
npm run compress:highlights -- public/assets/highlights/school_week_four
```

### Step 4: Update Stripe labels

In [`app/api/friday-register/route.ts`](../../../app/api/friday-register/route.ts):

- `product_data.name`: `{Theme} — {Month Day}` (e.g. `Desert Discovery — September 18`)
- `product_data.description`: `Sage Field Private School · ${price} per child · {full date}`
- `metadata.description`: `{Theme} Field Day Fee`

Do not change pricing constants unless user explicitly requests a price change.

### Step 5: Update success page

In [`app/friday/success/page.tsx`](../../../app/friday/success/page.tsx):

- Confirmation paragraph: date + theme name
- One-line activity recap (comma-separated, derived from user's 4 activities)
- Accent border/icon colors aligned with theme palette

### Step 6: Update homepage promo

In [`app/page.tsx`](../../../app/page.tsx) Field Day Friday Preview section:

- Badge: `This Friday · {short date} · Limited Spots`
- Theme title + "Field Day" headline animation
- Hero tagline paragraph
- Date/time/price/ages pills
- 4 activity chips (emoji + short title)
- CTA button text can stay thematic (e.g. "Join the Expedition →") or match new theme
- `DesertHeroScene compact` (or forked hero) + matching palette tokens

### Step 7: Grep for stale strings

Search and replace any leftover previous theme/date:

```bash
rg "Desert Discovery|September 18|Sept 18|2026-09-18" app/friday app/api/friday-register app/page.tsx
```

Also grep the old hero component name if you forked a new one.

### Step 8: Verify

1. `npx tsc --noEmit`
2. Spot-check `/friday`: hero, flip cards, form, sticky bar, agreement drawer
3. Spot-check homepage Field Day promo block
4. Spot-check `/friday/success` copy
5. Confirm `prefers-reduced-motion` still respected on homepage letter-drop animation

## Example usage

User message:

> @friday-field-day-page
>
> Theme: Ocean Explorers
> Date: Friday, September 25, 2026
> Countdown ISO: 2026-09-25T08:30:00-05:00
> Hero tagline: Dive into tide pools, sand art, and shell sorting at Sage Field!
>
> Activities:
> 1. 🐚 | Tide Pool Hunt | Shore Station | Search tide pools for shells, crabs, and sea glass.
> 2. 🎨 | Sand Art | Beach Studio | Layer colored sand into ocean-themed bottles to take home.
> 3. 🦀 | Shell Sorting | Shell Cove | Sort shells by shape and size — learn which creatures lived inside.
> 4. 🌊 | Wave Relay | Splash Zone | Team relay races with water buckets and beach balls.
>
> Photos: public/assets/highlights/school_week_five
> Visual: new motif — ocean blues, waves, shells

Agent actions:

1. Read this skill + [reference.md](reference.md)
2. Fork `OceanHeroScene.tsx` with ocean palette
3. Update all four files with Ocean Explorers copy
4. Grep for stale Desert Discovery strings
5. Typecheck and report ready for visual QA

## Out of scope

- Changing drop-in price (`shared/billing/school-year.ts`) unless user asks
- Week highlights page Field Friday section ([newsletter-highlights-page](../newsletter-highlights-page/SKILL.md))
- Zoho parent newsletter email ([school-year-newsletter-email](../school-year-newsletter-email/SKILL.md))
- Supabase DDL / migrations
- Admin outreach email buttons

## Verify before delivering

- [ ] All user-provided theme/activity copy used verbatim
- [ ] Countdown ISO matches user's date at 8:30 AM CT
- [ ] Stripe product name + description updated
- [ ] Success page date + activity recap updated
- [ ] Homepage promo matches Friday page theme
- [ ] No stale previous theme/date strings remain
- [ ] Form logic, pricing, legal arrays unchanged
- [ ] `npx tsc --noEmit` passes

## Reference

- File touch map, activity schema, grep checklist, historical examples: [reference.md](reference.md)
